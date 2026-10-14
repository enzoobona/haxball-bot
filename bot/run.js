// Supervisor: arranca el bot y lo reinicia si se cae.
//   npm start        -> con reinicio automático
//   npm run start:once -> una sola vez (sin supervisor)
//
// Limitación importante: el HAXBALL_TOKEN de Haxball vence rápido y no se puede renovar
// solo. Si el bot se cae por un error del propio programa, se reinicia y sigue; pero si
// el motivo es que el token venció, no tiene sentido reintentar: se corta y te avisa.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./script.js", import.meta.url));
const FAST_FAILURE_MS = 60_000;
const MAX_FAST_FAILURES = 3;
const TOKEN_EXIT_CODE = 2;

let child = null;
let stopping = false;
let fastFailures = 0;

function start() {
    const startedAt = Date.now();

    child = spawn(process.execPath, [SCRIPT], { stdio: "inherit" });

    child.on("exit", (code, signal) => {
        child = null;

        if (stopping || code === 0) {
            process.exit(code ?? 0);
        }

        if (code === TOKEN_EXIT_CODE) {
            console.error("[run] El token de Haxball no sirve. Generá uno nuevo y volvé a ejecutar npm start.");
            process.exit(TOKEN_EXIT_CODE);
        }

        fastFailures = Date.now() - startedAt < FAST_FAILURE_MS ? fastFailures + 1 : 0;

        if (fastFailures >= MAX_FAST_FAILURES) {
            console.error(
                `[run] El bot se cayó ${MAX_FAST_FAILURES} veces seguidas en menos de un minuto ` +
                "(¿token vencido, .env incompleto o Bracket inaccesible?). No se reintenta más."
            );
            process.exit(1);
        }

        const delay = 5_000 * Math.max(1, fastFailures);

        console.error(`[run] El bot terminó (código ${code ?? signal}). Reiniciando en ${delay / 1000}s...`);

        setTimeout(start, delay);
    });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
        stopping = true;
        child?.kill(signal);

        if (!child) process.exit(0);
    });
}

start();
