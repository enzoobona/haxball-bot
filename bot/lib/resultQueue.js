import fs from "node:fs";
import path from "node:path";

// Cola persistente (archivo JSON) de resultados que no se pudieron enviar a Bracket.
// Si el bot o Bracket se caen justo al terminar un partido, el resultado NO se pierde:
// queda en disco y se reintenta solo.

export function createResultQueue(filePath) {
    function load() {
        try {
            const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));

            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function save(items) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        // Escritura atómica: primero a un temporal y después se renombra.
        const tmpPath = `${filePath}.tmp`;

        fs.writeFileSync(tmpPath, JSON.stringify(items, null, 2));
        fs.renameSync(tmpPath, filePath);
    }

    return {
        list() {
            return load();
        },

        size() {
            return load().length;
        },

        // entry = { matchId, tournamentId, body }
        enqueue(entry, lastError = null) {
            const items = load().filter(item => item.matchId !== entry.matchId);

            items.push({
                ...entry,
                attempts: 0,
                stuck: false,
                createdAt: new Date().toISOString(),
                lastError
            });

            save(items);
        },

        remove(matchId) {
            save(load().filter(item => item.matchId !== matchId));
        },

        update(matchId, patch) {
            save(load().map(item => (
                item.matchId === matchId ? { ...item, ...patch } : item
            )));
        }
    };
}

function errorMessage(error) {
    return error?.response?.data?.detail
        ?? error?.message
        ?? String(error);
}

// Bracket responde 400 "already been played" si el resultado ya había llegado
// (por ejemplo, la respuesta se perdió pero el servidor sí lo guardó).
export function isAlreadyRegisteredError(error) {
    const detail = error?.response?.data?.detail;

    return error?.response?.status === 400
        && typeof detail === "string"
        && detail.toLowerCase().includes("already been played");
}

// Intenta enviar todo lo pendiente. `send(entry)` debe lanzar si falla.
export async function flushQueue(queue, send, { maxAttempts = 50 } = {}) {
    const result = { sent: [], alreadyRegistered: [], failed: [], stuck: [] };

    for (const entry of queue.list()) {
        if (entry.stuck) {
            result.stuck.push(entry.matchId);
            continue;
        }

        try {
            await send(entry);

            queue.remove(entry.matchId);
            result.sent.push(entry.matchId);
        } catch (error) {
            if (isAlreadyRegisteredError(error)) {
                queue.remove(entry.matchId);
                result.alreadyRegistered.push(entry.matchId);
                continue;
            }

            const attempts = (entry.attempts ?? 0) + 1;
            const stuck = attempts >= maxAttempts;

            queue.update(entry.matchId, {
                attempts,
                stuck,
                lastError: errorMessage(error)
            });

            (stuck ? result.stuck : result.failed).push(entry.matchId);
        }
    }

    return result;
}
