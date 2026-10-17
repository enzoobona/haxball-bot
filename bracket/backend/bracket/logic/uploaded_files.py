import os
from pathlib import Path

import aiofiles
import aiofiles.os
from fastapi import UploadFile
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from bracket.database import database
from bracket.utils.logging import logger

STATIC_ROOT = Path("static")
ALLOWED_LOGO_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")
MAX_LOGO_SIZE_BYTES = 5 * 1024**2

# Carpetas dentro de `static/` cuyo contenido se replica en la base de datos.
UPLOAD_FOLDERS = ("team-logos", "tournament-logos")

_table_ready = False


def get_logo_extension(file: UploadFile) -> str:
    """Extensión normalizada (minúsculas). Responde 400 en vez de romper con un 500."""
    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in ALLOWED_LOGO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato de imagen no soportado. Usá: {', '.join(ALLOWED_LOGO_EXTENSIONS)}",
        )
    return extension


async def read_logo_content(file: UploadFile) -> bytes:
    """Lee el archivo subido validando que no esté vacío ni supere el tamaño máximo."""
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")
    if len(content) > MAX_LOGO_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="La imagen no puede superar los 5 MB.")
    return content


def _relative_key(file_path: str | Path) -> str:
    """`static/team-logos/x.png` -> `team-logos/x.png` (la clave que usa la URL pública)."""
    parts = Path(str(file_path).replace("\\", "/")).parts
    return "/".join(parts[1:]) if parts and parts[0] == STATIC_ROOT.name else "/".join(parts)


async def ensure_uploaded_files_table() -> None:
    """Crea la tabla si no existe.

    Normalmente la crea la migración `d4e8f2a1b7c3`, pero si por algún motivo no corrió (por
    ejemplo `AUTO_RUN_MIGRATIONS=false`) los logos nunca llegarían a guardarse en la base.
    """
    global _table_ready  # noqa: PLW0603
    if _table_ready:
        return

    await database.execute(
        query="""
            CREATE TABLE IF NOT EXISTS uploaded_files (
                path VARCHAR NOT NULL PRIMARY KEY,
                data BYTEA NOT NULL,
                created TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        """
    )
    _table_ready = True


async def save_uploaded_file(file_path: str, content: bytes) -> None:
    """Guarda el archivo en la base de datos (fuente de verdad) y una copia en disco.

    La base va primero: si falla, el error llega al usuario en vez de quedar un logo que solo
    existe en el disco efímero del servidor. El disco es solo una caché; si no se puede escribir
    se registra el aviso y se sigue, porque el archivo se restaura desde la base al pedirlo.
    """
    await ensure_uploaded_files_table()
    await database.execute(
        query="""
            INSERT INTO uploaded_files (path, data)
            VALUES (:path, :data)
            ON CONFLICT (path) DO UPDATE SET data = EXCLUDED.data
        """,
        values={"path": _relative_key(file_path), "data": content},
    )
    logger.info(f"Saved uploaded file in database: {_relative_key(file_path)} ({len(content)} B)")

    try:
        await aiofiles.os.makedirs(os.path.dirname(file_path), exist_ok=True)
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
    except OSError as exc:
        logger.warning(f"Could not write uploaded file to disk: {file_path}\n{exc}")


async def remove_uploaded_file(file_path: str) -> None:
    """Borra el archivo del disco (si existe) y su copia en la base de datos."""
    await ensure_uploaded_files_table()
    await database.execute(
        query="DELETE FROM uploaded_files WHERE path = :path",
        values={"path": _relative_key(file_path)},
    )
    try:
        await aiofiles.os.remove(file_path)
    except FileNotFoundError:
        pass
    except Exception as exc:
        logger.error(f"Could not remove file that should still exist: {file_path}\n{exc}")


async def restore_uploaded_file(key: str) -> bool:
    """Si el archivo falta en disco pero está en la base, lo vuelve a escribir."""
    key = key.replace("\\", "/")
    await ensure_uploaded_files_table()
    row = await database.fetch_one(
        query="SELECT data FROM uploaded_files WHERE path = :path", values={"path": key}
    )
    if row is None:
        return False

    target = (STATIC_ROOT / key).resolve()
    if not target.is_relative_to(STATIC_ROOT.resolve()):
        return False

    await aiofiles.os.makedirs(target.parent, exist_ok=True)
    async with aiofiles.open(target, "wb") as f:
        await f.write(bytes(row["data"]))
    return True


async def init_uploaded_files() -> None:
    """Al arrancar: asegura la tabla y copia a la base los logos que solo existían en disco.

    Nunca debe impedir que arranque la aplicación, por eso solo registra los errores.
    """
    try:
        await ensure_uploaded_files_table()

        copied = 0
        for folder in UPLOAD_FOLDERS:
            folder_path = STATIC_ROOT / folder
            if not folder_path.is_dir():
                continue
            for file in folder_path.iterdir():
                if not file.is_file():
                    continue
                await database.execute(
                    query="""
                        INSERT INTO uploaded_files (path, data)
                        VALUES (:path, :data)
                        ON CONFLICT (path) DO NOTHING
                    """,
                    values={"path": f"{folder}/{file.name}", "data": file.read_bytes()},
                )
                copied += 1

        total = await database.fetch_val(query="SELECT count(*) FROM uploaded_files")
        logger.info(f"uploaded_files ready: {total} files in database ({copied} found on disk)")
    except Exception as exc:
        logger.error(f"Could not initialize uploaded_files: {exc!r}")


class StaticFilesWithDatabaseFallback(StaticFiles):
    """Sirve `static/`; si un archivo subido no está en disco, lo restaura desde la base."""

    async def get_response(self, path: str, scope: Scope):  # type: ignore[no-untyped-def]
        try:
            return await super().get_response(path, scope)
        except HTTPException as exc:
            if exc.status_code != 404 or not await restore_uploaded_file(path):
                raise
            return await super().get_response(path, scope)