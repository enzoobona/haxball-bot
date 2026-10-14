// Lee la configuración del bot desde variables de entorno (.env).
// Todo es opcional: sin configurar nada el bot se comporta como antes.

function toBool(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;

    return !["0", "false", "no", "off"].includes(String(value).trim().toLowerCase());
}

function toInt(value, fallback, { min = -Infinity, max = Infinity } = {}) {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed)) return fallback;

    return Math.min(max, Math.max(min, parsed));
}

function toList(value) {
    if (!value) return [];

    return String(value)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

export function loadSettings(env = process.env) {
    return {
        roomName: env.ROOM_NAME || "Torneo Haxball",
        roomPassword: env.ROOM_PASSWORD || null,
        roomPublic: toBool(env.ROOM_PUBLIC, false),
        maxPlayers: toInt(env.ROOM_MAX_PLAYERS, 16, { min: 2, max: 30 }),

        // Si hay ADMIN_PASSWORD o ADMIN_AUTHS, el primer jugador que entra YA NO es admin
        // automáticamente: hay que usar !admin <clave> o estar en ADMIN_AUTHS.
        adminPassword: env.ADMIN_PASSWORD || null,
        adminAuths: toList(env.ADMIN_AUTHS),

        // Solo los jugadores inscriptos en el equipo del partido pueden jugarlo.
        enforceRosters: toBool(env.ENFORCE_ROSTERS, true),

        // Muerte súbita (gol de oro) cuando hay empate en eliminación directa.
        overtimeSeconds: toInt(env.OVERTIME_SECONDS, 180, { min: 30, max: 1800 }),

        // Cada cuántos minutos se refrescan jugadores/equipos desde Bracket.
        refreshMinutes: toInt(env.REFRESH_MINUTES, 5, { min: 1, max: 120 }),

        // Reintento automático de resultados pendientes (segundos).
        retrySeconds: toInt(env.RETRY_SECONDS, 60, { min: 10, max: 3600 }),

        saveReplays: toBool(env.SAVE_REPLAYS, true),
        dataDir: env.DATA_DIR || "data",
        replaysDir: env.REPLAYS_DIR || "replays",

        // Segundos que se espera el link de la sala antes de asumir que el token venció.
        roomLinkTimeoutSeconds: toInt(env.ROOM_LINK_TIMEOUT_SECONDS, 60, { min: 10, max: 600 })
    };
}

export function hasAdminAuthConfigured(settings) {
    return Boolean(settings.adminPassword) || settings.adminAuths.length > 0;
}
