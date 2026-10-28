"""Reglas puras de la identidad de Haxball (nombres, codigos de vinculacion).

Nada de esto toca la base de datos, asi que es facil de probar.
"""

import hashlib
import re
import secrets
import unicodedata

# Sin 0/O, 1/I/L: se leen mal y se confunden al tipear.
LINK_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
LINK_CODE_LENGTH = 8
LINK_CODE_TTL_MINUTES = 10

# Cuantos navegadores (auth) puede tener vinculados un mismo perfil.
MAX_IDENTITIES_PER_PROFILE = 5

NICKNAME_MIN_LENGTH = 2
NICKNAME_MAX_LENGTH = 30

# Caracteres que el bot usa como sintaxis en los comandos (!cmd, #id, "nombre con espacios").
_FORBIDDEN_NICKNAME_START = ("#", '"', "!")
_CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]")


def normalize_player_name(name: str) -> str:
    """Misma normalizacion que `normalizeName` del bot: sin tildes, sin bordes y en minusculas."""
    decomposed = unicodedata.normalize("NFD", str(name))
    without_marks = "".join(char for char in decomposed if not unicodedata.combining(char))
    return without_marks.strip().lower()


def validate_nickname(name: str) -> str:
    """Devuelve el nombre sin espacios en los bordes o lanza ValueError con el motivo."""
    cleaned = name.strip()

    if len(cleaned) < NICKNAME_MIN_LENGTH or len(cleaned) > NICKNAME_MAX_LENGTH:
        raise ValueError(
            f"The name must be between {NICKNAME_MIN_LENGTH} and {NICKNAME_MAX_LENGTH} characters"
        )

    if cleaned.startswith(_FORBIDDEN_NICKNAME_START):
        raise ValueError('The name cannot start with "#", "!" or a double quote')

    if _CONTROL_CHARS.search(cleaned):
        raise ValueError("The name contains invalid characters")

    return cleaned


def generate_link_code() -> str:
    return "".join(secrets.choice(LINK_CODE_ALPHABET) for _ in range(LINK_CODE_LENGTH))


def format_link_code(code: str) -> str:
    """ABCD2345 -> ABCD-2345 (solo para mostrarlo)."""
    half = LINK_CODE_LENGTH // 2
    return f"{code[:half]}-{code[half:]}"


def clean_link_code(raw: str) -> str:
    """Acepta el codigo con guion, espacios o en minusculas."""
    return re.sub(r"[\s-]", "", raw).upper()


def hash_link_code(raw: str) -> str:
    """El codigo nunca se guarda en claro: si se filtra la base, no sirve para vincular."""
    return hashlib.sha256(clean_link_code(raw).encode("utf-8")).hexdigest()


def is_well_formed_link_code(raw: str) -> bool:
    code = clean_link_code(raw)
    return len(code) == LINK_CODE_LENGTH and all(char in LINK_CODE_ALPHABET for char in code)


def mask_auth(auth: str) -> str:
    """El navegador del propio usuario se muestra recortado (abcd…wxyz)."""
    if len(auth) <= 10:
        return "…"
    return f"{auth[:4]}…{auth[-4:]}"
