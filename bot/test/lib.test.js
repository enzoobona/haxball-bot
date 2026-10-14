import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { createAuthStore, normalizeName } from "../lib/authStore.js";
import { createResultQueue, flushQueue, isAlreadyRegisteredError } from "../lib/resultQueue.js";
import { hasAdminAuthConfigured, loadSettings } from "../lib/settings.js";
import { createTeamStyles, generateStyle, loadTeamConfig } from "../lib/teamStyles.js";

function tmpFile(name) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hxbot-"));

    return path.join(dir, name);
}

// ---------------------------------------------------------------- settings

test("settings: valores por defecto", () => {
    const settings = loadSettings({});

    assert.equal(settings.enforceRosters, true);
    assert.equal(settings.overtimeSeconds, 180);
    assert.equal(settings.maxPlayers, 16);
    assert.equal(settings.roomPassword, null);
    assert.deepEqual(settings.adminAuths, []);
    assert.equal(hasAdminAuthConfigured(settings), false);
});

test("settings: parseo de variables y límites", () => {
    const settings = loadSettings({
        ENFORCE_ROSTERS: "false",
        OVERTIME_SECONDS: "5",
        ROOM_MAX_PLAYERS: "99",
        ADMIN_AUTHS: " abc , def ,,",
        ADMIN_PASSWORD: "secreto"
    });

    assert.equal(settings.enforceRosters, false);
    assert.equal(settings.overtimeSeconds, 30);
    assert.equal(settings.maxPlayers, 30);
    assert.deepEqual(settings.adminAuths, ["abc", "def"]);
    assert.equal(hasAdminAuthConfigured(settings), true);
});

// ------------------------------------------------------------- resultQueue

test("resultQueue: persiste en disco y no duplica por partido", () => {
    const file = tmpFile("pending.json");
    const queue = createResultQueue(file);

    queue.enqueue({ matchId: 7, tournamentId: 1, body: { a: 1 } }, "boom");
    queue.enqueue({ matchId: 7, tournamentId: 1, body: { a: 2 } });
    queue.enqueue({ matchId: 8, tournamentId: 1, body: {} });

    const reopened = createResultQueue(file);

    assert.equal(reopened.size(), 2);
    assert.equal(reopened.list().find(item => item.matchId === 7).body.a, 2);
});

test("resultQueue: flush envía, descarta ya registrados y cuenta reintentos", async () => {
    const queue = createResultQueue(tmpFile("pending.json"));

    queue.enqueue({ matchId: 1, tournamentId: 1, body: {} });
    queue.enqueue({ matchId: 2, tournamentId: 1, body: {} });
    queue.enqueue({ matchId: 3, tournamentId: 1, body: {} });

    const alreadyPlayed = Object.assign(new Error("x"), {
        response: { status: 400, data: { detail: "Match has already been played" } }
    });

    assert.equal(isAlreadyRegisteredError(alreadyPlayed), true);
    assert.equal(isAlreadyRegisteredError(new Error("otra cosa")), false);

    const send = async entry => {
        if (entry.matchId === 2) throw alreadyPlayed;
        if (entry.matchId === 3) throw new Error("Bracket caído");
    };

    const result = await flushQueue(queue, send, { maxAttempts: 2 });

    assert.deepEqual(result.sent, [1]);
    assert.deepEqual(result.alreadyRegistered, [2]);
    assert.deepEqual(result.failed, [3]);
    assert.equal(queue.size(), 1);
    assert.equal(queue.list()[0].attempts, 1);
    assert.equal(queue.list()[0].lastError, "Bracket caído");

    // segundo intento fallido => queda "stuck" y deja de reintentarse solo
    const second = await flushQueue(queue, send, { maxAttempts: 2 });

    assert.deepEqual(second.stuck, [3]);
    assert.equal(queue.list()[0].stuck, true);

    const third = await flushQueue(queue, async () => {
        throw new Error("no debería llamarse");
    }, { maxAttempts: 2 });

    assert.deepEqual(third.stuck, [3]);
});

// ---------------------------------------------------------------- authStore

test("authStore: vincula, detecta suplantación y permite desvincular", () => {
    const file = tmpFile("auth.json");
    const store = createAuthStore(file);

    assert.equal(store.checkAndBind("Enzo", "AUTH-1"), "bound");
    assert.equal(store.checkAndBind("enzo", "AUTH-1"), "ok");
    assert.equal(store.checkAndBind("ENZO", "AUTH-2"), "mismatch");
    assert.equal(store.checkAndBind("Enzo", undefined), "unverified");

    // persiste entre reinicios
    assert.equal(createAuthStore(file).checkAndBind("Enzo", "AUTH-2"), "mismatch");

    assert.equal(store.unbind("enzo"), true);
    assert.equal(store.unbind("enzo"), false);
    assert.equal(store.checkAndBind("Enzo", "AUTH-2"), "bound");
});

test("authStore: normaliza tildes y mayúsculas", () => {
    assert.equal(normalizeName("  Perú "), "peru");
    assert.equal(normalizeName("ÁÉÍÓÚ"), "aeiou");
});

// --------------------------------------------------------------- teamStyles

test("teamStyles: estilos configurados y equipos nuevos de Bracket", () => {
    const configFile = tmpFile("teams-config.json");

    fs.writeFileSync(configFile, JSON.stringify({
        teams: [{
            name: "Perú",
            angle: 0,
            textColor: "#000000",
            colors: ["#FF0D0D", "#FFFFFF", "#FF0000"],
            flag: "🇵🇪"
        }]
    }));

    const styles = createTeamStyles(loadTeamConfig(configFile));

    // configurado: se encuentra sin importar tildes/mayúsculas
    assert.equal(styles.getCountry("PERU").bandera, "🇵🇪");
    assert.deepEqual(styles.getCountry("peru").colors, [0xFF0D0D, 0xFFFFFF, 0xFF0000]);

    // un equipo de Bracket sin estilo propio NO existe hasta que se lo informa
    assert.equal(styles.getCountry("Los Pibes"), undefined);

    styles.setKnownTeams(["Los Pibes", "Perú"]);

    const generated = styles.getCountry("los pibes");

    assert.ok(generated);
    assert.equal(generated.nombre, "los pibes");
    assert.equal(generated.colors.length, 1);
    assert.ok([0x000000, 0xFFFFFF].includes(generated.textColor));

    // determinístico
    assert.deepEqual(generateStyle("Los Pibes"), generateStyle("los pibes"));
    assert.notDeepEqual(generateStyle("Los Pibes").colors, generateStyle("Otros").colors);

    // lo que no es ni configurado ni de Bracket sigue siendo inválido (typos en !camisetas)
    assert.equal(styles.getCountry("noexiste"), undefined);
});

test("teamStyles: teams-config.json del proyecto es válido", () => {
    const configured = loadTeamConfig(fileURLToPath(new URL("../teams-config.json", import.meta.url)));

    assert.equal(configured.length, 7);

    for (const style of configured) {
        assert.ok(style.colors.length >= 1 && style.colors.length <= 3);
        assert.ok(style.colors.every(color => Number.isInteger(color) && color >= 0 && color <= 0xFFFFFF));
    }
});

// ------------------------------------------- estilos cargados en Bracket

test("teamStyles: lo cargado en Bracket tiene prioridad sobre teams-config.json", () => {
    const styles = createTeamStyles(loadTeamConfig(
        fileURLToPath(new URL("../teams-config.json", import.meta.url))
    ));

    // Paraguay: franjas horizontales (90°) rojo/blanco/azul en teams-config.json
    const base = styles.getCountry("Paraguay");

    assert.equal(base.angle, 90);
    assert.equal(base.bandera, "🇵🇾");

    styles.setBracketTeams([{
        name: "Paraguay",
        shirt_color_1: "#FFFF00",
        shirt_color_2: "#000000",
        shirt_color_3: null,
        shirt_text_color: "#123456",
        shirt_angle: 0,
        emoji: "🦅"
    }]);

    const custom = styles.getCountry("paraguay");

    assert.deepEqual(custom.colors, [0xFFFF00, 0x000000]);
    assert.equal(custom.angle, 0);
    assert.equal(custom.textColor, 0x123456);
    assert.equal(custom.bandera, "🦅");
    assert.equal(custom.nombre, "paraguay");
});

test("teamStyles: cada dato se resuelve por separado", () => {
    const styles = createTeamStyles(loadTeamConfig(
        fileURLToPath(new URL("../teams-config.json", import.meta.url))
    ));

    // Solo emoji en Bracket: conserva colores, ángulo y texto de teams-config.json
    styles.setBracketTeams([{ name: "Paraguay", shirt_angle: 180, emoji: "🦅" }]);

    const onlyEmoji = styles.getCountry("Paraguay");

    assert.equal(onlyEmoji.bandera, "🦅");
    assert.equal(onlyEmoji.angle, 90); // el ángulo de Bracket (default 180) NO pisa sin colores
    assert.deepEqual(onlyEmoji.colors, [0xFF1212, 0xFFFFFF, 0x0800FF]);

    // Colores sin color de texto: se calcula uno legible
    styles.setBracketTeams([
        { name: "Amarillos", shirt_color_1: "#FFEE00" },
        { name: "Oscuros", shirt_color_1: "#101030" }
    ]);

    assert.equal(styles.getCountry("Amarillos").textColor, 0x000000);
    assert.equal(styles.getCountry("Oscuros").textColor, 0xFFFFFF);
    assert.equal(styles.getCountry("Amarillos").bandera, "🏳️"); // sin emoji: bandera genérica
});

test("teamStyles: valores inválidos de Bracket se ignoran y el cache se renueva", () => {
    const styles = createTeamStyles([]);

    styles.setBracketTeams([{
        name: "Raros",
        shirt_color_1: "rojo",
        shirt_color_2: "#GGGGGG",
        shirt_text_color: "negro",
        emoji: "   "
    }]);

    const weird = styles.getCountry("Raros");

    assert.deepEqual(weird.colors, generateStyle("Raros").colors); // cayó al generado
    assert.equal(weird.bandera, "🏳️");

    // Al refrescar desde Bracket, un cambio se ve de inmediato
    styles.setBracketTeams([{ name: "Raros", shirt_color_1: "#00FF00", emoji: "🔥" }]);

    assert.deepEqual(styles.getCountry("Raros").colors, [0x00FF00]);
    assert.equal(styles.getCountry("Raros").bandera, "🔥");

    // Un equipo que dejó de existir en Bracket (y no está configurado) ya no es válido
    styles.setBracketTeams([]);

    assert.equal(styles.getCountry("Raros"), undefined);
});
