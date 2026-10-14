import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";

// Servidor Bracket falso: acepta solo el token "fresh" (el "stale" da 401).
let server;
let logins = 0;
const requests = [];

before(async () => {
    server = http.createServer((req, res) => {
        const url = new URL(req.url, "http://localhost");

        requests.push({ method: req.method, path: url.pathname, query: url.search, auth: req.headers.authorization });

        const send = (status, body) => {
            res.writeHead(status, { "Content-Type": "application/json" });
            res.end(JSON.stringify(body));
        };

        if (url.pathname === "/token") {
            logins++;
            return send(200, { access_token: "fresh", token_type: "bearer" });
        }

        if (req.headers.authorization !== "Bearer fresh") {
            return send(401, { detail: "Could not validate credentials" });
        }

        if (url.pathname === "/tournaments/1/players") {
            // 250 jugadores, paginados de a lo sumo 100
            const limit = Number(url.searchParams.get("limit") ?? 25);
            const offset = Number(url.searchParams.get("offset") ?? 0);
            const all = Array.from({ length: 250 }, (_, i) => ({ id: i + 1, name: `P${i + 1}` }));

            return send(200, {
                data: { players: all.slice(offset, offset + Math.min(limit, 100)), count: all.length }
            });
        }

        if (url.pathname === "/tournaments/1/ping") {
            return send(200, { data: "pong" });
        }

        return send(404, { detail: "not found" });
    });

    await new Promise(resolve => server.listen(0, resolve));

    process.env.BRACKET_API_URL = `http://127.0.0.1:${server.address().port}`;
    process.env.BRACKET_USERNAME = "admin@example.com";
    process.env.BRACKET_PASSWORD = "pw";
});

after(() => server.close());

test("api: renueva el token solo cuando recibe 401 y reintenta la petición", async () => {
    const { api, setAccessToken } = await import("../bracket-api/api.js");
    await import("../bracket-api/auth.js"); // registra el re-login

    setAccessToken("stale");

    const { data } = await api.get("/tournaments/1/ping");

    assert.equal(data.data, "pong");
    assert.equal(logins, 1);

    // una vez renovado, no se vuelve a loguear
    await api.get("/tournaments/1/ping");
    assert.equal(logins, 1);
});

test("api: varias peticiones con el token vencido hacen un solo login", async () => {
    const { api, setAccessToken } = await import("../bracket-api/api.js");

    const before = logins;

    setAccessToken("stale");

    const results = await Promise.all([
        api.get("/tournaments/1/ping"),
        api.get("/tournaments/1/ping"),
        api.get("/tournaments/1/ping")
    ]);

    assert.ok(results.every(response => response.data.data === "pong"));
    assert.equal(logins - before, 1);
});

test("players: trae todas las páginas (más de 25 jugadores)", async () => {
    const { obtenerJugadores } = await import("../bracket-api/players.js");

    const players = await obtenerJugadores(1);

    assert.equal(players.length, 250);
    assert.equal(players.at(-1).name, "P250");
});
