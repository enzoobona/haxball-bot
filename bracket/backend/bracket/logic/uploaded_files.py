import os
from pathlib import Path

import aiofiles
import aiofiles.os
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles
from starlette.types import Scope

from bracket.database import database
from bracket.utils.logging import logger

STATIC_ROOT = Path("static")


def _relative_key(file_path: str) -> str:
    """`static/team-logos/x.png` -> `team-logos/x.png` (la clave que usa la URL pública)."""
    parts = Path(file_path).parts
    return "/".join(parts[1:]) if parts and parts[0] == STATIC_ROOT.name else "/".join(parts)


async def save_uploaded_file(file_path: str, content: bytes) -> None:
    """Escribe el archivo en disco y guarda una copia en la base de datos."""
    await aiofiles.os.makedirs(os.path.dirname(file_path), exist_ok=True)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    await database.execute(
        query="""
            INSERT INTO uploaded_files (path, data)
            VALUES (:path, :data)
            ON CONFLICT (path) DO UPDATE SET data = EXCLUDED.data
        """,
        values={"path": _relative_key(file_path), "data": content},
    )


async def remove_uploaded_file(file_path: str) -> None:
    """Borra el archivo del disco (si existe) y su copia en la base de datos."""
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


class StaticFilesWithDatabaseFallback(StaticFiles):
    """Sirve `static/`; si un archivo subido no está en disco, lo restaura desde la base."""

    async def get_response(self, path: str, scope: Scope):  # type: ignore[no-untyped-def]
        try:
            return await super().get_response(path, scope)
        except HTTPException as exc:
            if exc.status_code != 404 or not await restore_uploaded_file(path):
                raise
            return await super().get_response(path, scope)
