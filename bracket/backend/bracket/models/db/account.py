from enum import auto

from bracket.utils.types import EnumAutoStr


class UserAccountType(EnumAutoStr):
    REGULAR = auto()
    DEMO = auto()


class UserRole(EnumAutoStr):
    """
    ADMIN: crea y edita clubes, torneos y todo lo que cuelga de ellos (tambien el bot).
    USER: jugador con cuenta. Solo ve la parte publica y sus propias estadisticas.
    """

    ADMIN = auto()
    USER = auto()
