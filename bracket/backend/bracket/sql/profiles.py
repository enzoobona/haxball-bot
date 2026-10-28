from heliclockter import datetime_utc

from bracket.config import config
from bracket.database import database
from bracket.logic.haxball_identity import (
    LINK_CODE_TTL_MINUTES,
    hash_link_code,
    mask_auth,
    normalize_player_name,
)
from bracket.models.db.profile import (
    HaxballIdentityForBot,
    HaxballIdentityMasked,
    PlayerProfile,
    PlayerProfilePublic,
    ProfileStats,
    ProfileTournamentStats,
)
from bracket.utils.id_types import PlayerProfileId, TournamentId, UserId


# ---------------------------------------------------------------------------
# Perfiles
# ---------------------------------------------------------------------------


async def sql_get_profile_by_user(user_id: UserId) -> PlayerProfile | None:
    result = await database.fetch_one(
        query="SELECT * FROM player_profiles WHERE user_id = :user_id",
        values={"user_id": user_id},
    )
    return PlayerProfile.model_validate(dict(result._mapping)) if result is not None else None


async def sql_get_profile_by_id(profile_id: PlayerProfileId) -> PlayerProfile | None:
    result = await database.fetch_one(
        query="SELECT * FROM player_profiles WHERE id = :profile_id",
        values={"profile_id": profile_id},
    )
    return PlayerProfile.model_validate(dict(result._mapping)) if result is not None else None


async def sql_get_profile_by_name(name: str) -> PlayerProfile | None:
    result = await database.fetch_one(
        query="SELECT * FROM player_profiles WHERE name_key = :name_key",
        values={"name_key": normalize_player_name(name)},
    )
    return PlayerProfile.model_validate(dict(result._mapping)) if result is not None else None


async def sql_create_profile(user_id: UserId, name: str) -> PlayerProfile:
    result = await database.fetch_one(
        query="""
            INSERT INTO player_profiles (user_id, name, name_key)
            VALUES (:user_id, :name, :name_key)
            RETURNING *
        """,
        values={"user_id": user_id, "name": name, "name_key": normalize_player_name(name)},
    )
    assert result is not None
    return PlayerProfile.model_validate(dict(result._mapping))


async def sql_rename_profile(profile_id: PlayerProfileId, name: str) -> PlayerProfile:
    result = await database.fetch_one(
        query="""
            UPDATE player_profiles
            SET name = :name, name_key = :name_key
            WHERE id = :profile_id
            RETURNING *
        """,
        values={"profile_id": profile_id, "name": name, "name_key": normalize_player_name(name)},
    )
    assert result is not None
    return PlayerProfile.model_validate(dict(result._mapping))


async def sql_search_profiles(search: str | None, limit: int) -> list[PlayerProfilePublic]:
    where = ""
    values: dict[str, str | int] = {"limit": limit}

    if search:
        escaped = (
            normalize_player_name(search).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        )
        where = "WHERE name_key LIKE :pattern"
        values["pattern"] = f"%{escaped}%"

    result = await database.fetch_all(
        query=f"""
            SELECT id, name
            FROM player_profiles
            {where}
            ORDER BY name_key
            LIMIT :limit
        """,
        values=values,
    )
    return [PlayerProfilePublic.model_validate(dict(row._mapping)) for row in result]


# ---------------------------------------------------------------------------
# Identidades (auth de Haxball)
# ---------------------------------------------------------------------------


async def sql_get_identities_of_profile(profile_id: PlayerProfileId) -> list[HaxballIdentityMasked]:
    result = await database.fetch_all(
        query="""
            SELECT id, auth, created
            FROM haxball_identities
            WHERE profile_id = :profile_id
            ORDER BY created
        """,
        values={"profile_id": profile_id},
    )
    return [
        HaxballIdentityMasked(
            id=row["id"], auth_hint=mask_auth(row["auth"]), created=row["created"]
        )
        for row in result
    ]


async def sql_count_identities_of_profile(profile_id: PlayerProfileId) -> int:
    return int(
        await database.fetch_val(
            query="SELECT count(*) FROM haxball_identities WHERE profile_id = :profile_id",
            values={"profile_id": profile_id},
        )
    )


async def sql_get_profile_id_of_auth(auth: str) -> PlayerProfileId | None:
    value = await database.fetch_val(
        query="SELECT profile_id FROM haxball_identities WHERE auth = :auth",
        values={"auth": auth},
    )
    return PlayerProfileId(value) if value is not None else None


async def sql_insert_identity(profile_id: PlayerProfileId, auth: str) -> None:
    await database.execute(
        query="INSERT INTO haxball_identities (profile_id, auth) VALUES (:profile_id, :auth)",
        values={"profile_id": profile_id, "auth": auth},
    )


async def sql_delete_identity(profile_id: PlayerProfileId, identity_id: int) -> bool:
    """Borra una identidad, pero solo si es del perfil indicado."""
    deleted = await database.fetch_val(
        query="""
            DELETE FROM haxball_identities
            WHERE id = :identity_id AND profile_id = :profile_id
            RETURNING id
        """,
        values={"identity_id": identity_id, "profile_id": profile_id},
    )
    return deleted is not None


async def sql_get_all_identities_for_bot() -> list[HaxballIdentityForBot]:
    result = await database.fetch_all(
        query="""
            SELECT i.auth, i.profile_id, p.name
            FROM haxball_identities i
            JOIN player_profiles p ON p.id = i.profile_id
        """
    )
    return [HaxballIdentityForBot.model_validate(dict(row._mapping)) for row in result]


# ---------------------------------------------------------------------------
# Codigos de vinculacion
# ---------------------------------------------------------------------------


async def sql_create_link_code(user_id: UserId, code: str) -> datetime_utc:
    """Guarda el hash del codigo. Los codigos anteriores del usuario dejan de servir."""
    async with database.transaction():
        await database.execute(
            query="DELETE FROM haxball_link_codes WHERE user_id = :user_id",
            values={"user_id": user_id},
        )
        # Aprovecha para limpiar los vencidos de cualquiera.
        await database.execute(query="DELETE FROM haxball_link_codes WHERE expires_at < NOW()")
        expires_at = await database.fetch_val(
            query=f"""
                INSERT INTO haxball_link_codes (user_id, code_hash, expires_at)
                VALUES (:user_id, :code_hash, NOW() + INTERVAL '{LINK_CODE_TTL_MINUTES} minutes')
                RETURNING expires_at
            """,
            values={"user_id": user_id, "code_hash": hash_link_code(code)},
        )
    return expires_at  # type: ignore[no-any-return]


async def sql_consume_link_code(raw_code: str) -> UserId | None:
    """Usa el codigo: devuelve el usuario dueno y lo borra (un solo uso). None si no sirve."""
    user_id = await database.fetch_val(
        query="""
            DELETE FROM haxball_link_codes
            WHERE code_hash = :code_hash AND expires_at > NOW()
            RETURNING user_id
        """,
        values={"code_hash": hash_link_code(raw_code)},
    )
    return UserId(user_id) if user_id is not None else None


# ---------------------------------------------------------------------------
# Vinculo perfil <-> filas de jugador de los torneos
# ---------------------------------------------------------------------------


async def sql_profile_has_player_in_tournament(
    profile_id: PlayerProfileId, tournament_id: TournamentId
) -> bool:
    found = await database.fetch_val(
        query="""
            SELECT 1 FROM players
            WHERE profile_id = :profile_id AND tournament_id = :tournament_id
            LIMIT 1
        """,
        values={"profile_id": profile_id, "tournament_id": tournament_id},
    )
    return found is not None


async def sql_link_open_players_by_name(profile: PlayerProfile) -> int:
    """Vincula las filas sin cuenta de torneos ABIERTOS cuyo nombre coincide con el del perfil.

    Los torneos archivados no se tocan: reclamar estadisticas viejas por nombre seria regalarselas
    a quien llegue primero. Para eso esta el vinculo manual de un administrador.
    """
    if not config.auto_link_players_by_name:
        return 0

    candidates = await database.fetch_all(
        query="""
            SELECT p.id, p.name, p.tournament_id
            FROM players p
            JOIN tournaments t ON t.id = p.tournament_id
            WHERE p.profile_id IS NULL AND t.status = 'OPEN'
            ORDER BY p.id
        """
    )

    linked_tournaments: set[int] = set()
    linked = 0
    for candidate in candidates:
        if normalize_player_name(candidate["name"]) != profile.name_key:
            continue
        if candidate["tournament_id"] in linked_tournaments:
            continue
        if await sql_profile_has_player_in_tournament(profile.id, candidate["tournament_id"]):
            continue

        await database.execute(
            query="UPDATE players SET profile_id = :profile_id WHERE id = :player_id",
            values={"profile_id": profile.id, "player_id": candidate["id"]},
        )
        linked_tournaments.add(candidate["tournament_id"])
        linked += 1

    return linked


async def sql_find_profile_id_for_new_player(
    name: str, tournament_id: TournamentId
) -> PlayerProfileId | None:
    """Perfil que corresponde a una fila nueva (por nombre), si la vinculacion automatica esta activa."""
    if not config.auto_link_players_by_name:
        return None

    profile = await sql_get_profile_by_name(name)
    if profile is None:
        return None
    if await sql_profile_has_player_in_tournament(profile.id, tournament_id):
        return None
    return profile.id


# ---------------------------------------------------------------------------
# Estadisticas acumuladas
# ---------------------------------------------------------------------------


async def sql_get_profile_stats(profile_id: PlayerProfileId) -> ProfileStats:
    row = await database.fetch_one(
        query="""
            SELECT
                COUNT(*) AS tournaments,
                COALESCE(SUM(wins + draws + losses), 0) AS matches_played,
                COALESCE(SUM(goals), 0) AS goals,
                COALESCE(SUM(assists), 0) AS assists,
                COALESCE(SUM(wins), 0) AS wins,
                COALESCE(SUM(draws), 0) AS draws,
                COALESCE(SUM(losses), 0) AS losses
            FROM players
            WHERE profile_id = :profile_id
        """,
        values={"profile_id": profile_id},
    )
    assert row is not None
    return ProfileStats.model_validate({key: int(value) for key, value in dict(row._mapping).items()})


async def sql_get_profile_tournament_stats(
    profile_id: PlayerProfileId,
) -> list[ProfileTournamentStats]:
    result = await database.fetch_all(
        query="""
            SELECT
                t.id AS tournament_id,
                t.name AS tournament_name,
                p.goals, p.assists, p.wins, p.draws, p.losses
            FROM players p
            JOIN tournaments t ON t.id = p.tournament_id
            WHERE p.profile_id = :profile_id
            ORDER BY t.start_time DESC
        """,
        values={"profile_id": profile_id},
    )
    return [ProfileTournamentStats.model_validate(dict(row._mapping)) for row in result]
