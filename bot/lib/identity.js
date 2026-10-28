import { normalizeName } from "./authStore.js";

// Identidad de los jugadores con cuenta (usuarios de la web).
//
// El "auth" de Haxball es una clave estable por navegador. El servidor guarda qué auth
// pertenece a qué jugador con cuenta (se vincula una sola vez con "!vincular CODIGO") y el bot
// baja esa lista para reconocer a cada jugador que entra, sin pedirle clave.
//
// Reglas (ver checkJoin):
//   * Un jugador reconocido es su perfil, entre en la sala con el nombre que entre. Sus
//     estadísticas van a la fila del torneo vinculada a su perfil, no a la que "se llame igual".
//   * El nombre de un perfil con navegador vinculado está RESERVADO: si entra otro auth con ese
//     nombre, se lo expulsa. Un perfil recién creado, sin navegador vinculado, todavía no
//     reserva nada (si no, su dueño no podría entrar a la sala a vincularse).
//   * Un jugador sin cuenta sigue como antes (nombre inscripto + authStore local).

export function createIdentityDirectory() {
    // auth -> { profileId, name }
    let byAuth = new Map();

    // nombre normalizado del perfil -> profileId (solo perfiles con navegador vinculado)
    let byKey = new Map();

    // profileId de los perfiles con al menos un navegador vinculado
    let verified = new Set();

    return {
        // `list` = respuesta de GET /haxball/identities: [{ auth, profile_id, name }]
        load(list) {
            const nextByAuth = new Map();
            const nextByKey = new Map();
            const nextVerified = new Set();

            for (const item of list ?? []) {
                if (!item?.auth || item.profile_id == null) continue;

                const profile = { profileId: item.profile_id, name: item.name };

                nextByAuth.set(item.auth, profile);
                nextByKey.set(normalizeName(item.name), item.profile_id);
                nextVerified.add(item.profile_id);
            }

            byAuth = nextByAuth;
            byKey = nextByKey;
            verified = nextVerified;
        },

        getByAuth(auth) {
            if (!auth) return null;

            return byAuth.get(auth) ?? null;
        },

        // profileId del perfil (con navegador vinculado) que reservó ese nombre, o null.
        reservedBy(name) {
            return byKey.get(normalizeName(name)) ?? null;
        },

        isVerified(profileId) {
            return verified.has(profileId);
        },

        size() {
            return byAuth.size;
        }
    };
}

function rowProfileId(row) {
    return row?.profile_id ?? null;
}

// Fila de jugador del torneo (la de Bracket) que corresponde a alguien que está en la sala.
//   profile: { profileId, name } si el jugador fue reconocido; null si no.
export function resolveRosterPlayer(bracketPlayers, { name, profile = null, directory = null }) {
    if (profile) {
        const linked = bracketPlayers.find(row => rowProfileId(row) === profile.profileId);

        if (linked) return linked;

        // Todavía sin vincular a mano: sirve la fila sin cuenta que se llama como su perfil.
        const profileKey = normalizeName(profile.name);

        return bracketPlayers.find(
            row => rowProfileId(row) === null && normalizeName(row.name) === profileKey
        ) ?? null;
    }

    const wanted = normalizeName(name);

    return bracketPlayers.find(row => {
        if (normalizeName(row.name) !== wanted) return false;

        const owner = rowProfileId(row);

        // Una fila de un jugador con cuenta verificada solo la puede jugar su dueño.
        return owner === null || !(directory?.isVerified(owner) ?? false);
    }) ?? null;
}

// Decide qué hacer cuando alguien entra a la sala.
// Devuelve { action: "allow", profile } o { action: "kick", message }.
export function checkJoin({ name, auth, directory, bracketPlayers }) {
    const profile = directory.getByAuth(auth);
    const key = normalizeName(name);
    const owner = directory.reservedBy(name);

    if (profile) {
        if (owner !== null && owner !== profile.profileId) {
            return {
                action: "kick",
                message: "Ese nombre está reservado por otro jugador registrado. " +
                    "Cambiá tu nombre y volvé a entrar."
            };
        }

        const profileKey = normalizeName(profile.name);

        // Una fila inscripta con ese nombre que no es suya: se parecería a otro jugador.
        const foreign = bracketPlayers.some(row => {
            if (normalizeName(row.name) !== key) return false;

            const rowOwner = rowProfileId(row);

            if (rowOwner === profile.profileId) return false;
            if (rowOwner === null && key === profileKey) return false;

            return true;
        });

        if (foreign) {
            return {
                action: "kick",
                message: "Ese nombre pertenece a otro jugador inscripto. Cambiá tu nombre y volvé a entrar."
            };
        }

        return { action: "allow", profile };
    }

    // Sin cuenta reconocida (o Haxball no entregó auth).
    const claimedByRow = bracketPlayers.some(row => {
        if (normalizeName(row.name) !== key) return false;

        const rowOwner = rowProfileId(row);

        return rowOwner !== null && directory.isVerified(rowOwner);
    });

    if (owner !== null || claimedByRow) {
        return {
            action: "kick",
            message: "Ese nombre está reservado por un usuario registrado. Si es tu cuenta, entrá con " +
                "otro nombre, escribí !vincular CODIGO (el código se genera en la web) y volvé a entrar."
        };
    }

    return { action: "allow", profile: null };
}
