import fs from "node:fs";
import path from "node:path";

// Vincula el nombre de un jugador inscripto con su "auth" de Haxball (clave pública estable
// por navegador). La primera vez que un nombre inscripto entra queda vinculado; si otra
// persona intenta entrar con ese nombre se la rechaza. Un admin puede liberarlo con
// !desvincular (por ejemplo, si el jugador cambió de computadora).
//
// Importante: el auth NO es una contraseña. Si alguien borra los datos de su navegador,
// obtiene otro auth. Sirve para evitar suplantaciones casuales, no ataques dirigidos.

export function normalizeName(name) {
    return String(name ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

export function createAuthStore(filePath) {
    let bindings = {};

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));

        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            bindings = parsed;
        }
    } catch {
        bindings = {};
    }

    function save() {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        const tmpPath = `${filePath}.tmp`;

        fs.writeFileSync(tmpPath, JSON.stringify(bindings, null, 2));
        fs.renameSync(tmpPath, filePath);
    }

    return {
        // Devuelve "bound" (se vinculó recién), "ok" (coincide), "mismatch" (otro dueño)
        // o "unverified" (Haxball no entregó auth, no se puede verificar).
        checkAndBind(name, auth) {
            if (!auth) return "unverified";

            const key = normalizeName(name);
            const current = bindings[key];

            if (!current) {
                bindings[key] = auth;
                save();

                return "bound";
            }

            return current === auth ? "ok" : "mismatch";
        },

        unbind(name) {
            const key = normalizeName(name);

            if (!(key in bindings)) return false;

            delete bindings[key];
            save();

            return true;
        },

        isBound(name) {
            return normalizeName(name) in bindings;
        },

        count() {
            return Object.keys(bindings).length;
        }
    };
}
