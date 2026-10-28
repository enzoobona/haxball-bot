import assert from "node:assert/strict";
import { test } from "node:test";

import { checkJoin, createIdentityDirectory, resolveRosterPlayer } from "../lib/identity.js";

const IDENTITIES = [
    { auth: "auth-messi-pc", profile_id: 1, name: "Messi" },
    { auth: "auth-messi-notebook", profile_id: 1, name: "Messi" },
    { auth: "auth-dibu", profile_id: 2, name: "Dibu Martínez" }
];

// Filas de jugadores del torneo (lo que devuelve Bracket).
const ROSTER = [
    { id: 10, name: "Messi", profile_id: 1 },
    { id: 11, name: "Dibu Martinez", profile_id: 2 },
    { id: 12, name: "Pablo", profile_id: null },
    { id: 13, name: "Leo", profile_id: 1 },
    { id: 14, name: "Tito", profile_id: 3 } // perfil 3 todavía sin navegador vinculado
];

function directory() {
    const dir = createIdentityDirectory();

    dir.load(IDENTITIES);

    return dir;
}

test("directorio: reconoce por auth y reserva nombres sin importar tildes ni mayúsculas", () => {
    const dir = directory();

    assert.equal(dir.size(), 3);
    assert.deepEqual(dir.getByAuth("auth-messi-notebook"), { profileId: 1, name: "Messi" });
    assert.equal(dir.getByAuth("otro"), null);
    assert.equal(dir.getByAuth(null), null);
    assert.equal(dir.reservedBy("dibu martinez"), 2);
    assert.equal(dir.reservedBy("MESSI"), 1);
    assert.equal(dir.reservedBy("Pablo"), null);
    assert.equal(dir.isVerified(1), true);
    assert.equal(dir.isVerified(3), false);
});

test("directorio: load reemplaza todo lo anterior y tolera datos raros", () => {
    const dir = directory();

    dir.load([{ auth: "x", profile_id: 9, name: "Nuevo" }, { profile_id: 5, name: "SinAuth" }, null]);

    assert.equal(dir.size(), 1);
    assert.equal(dir.getByAuth("auth-messi-pc"), null);
    assert.equal(dir.reservedBy("Messi"), null);

    dir.load(undefined);

    assert.equal(dir.size(), 0);
});

test("entrada: el dueño entra desde cualquiera de sus navegadores", () => {
    const dir = directory();

    for (const auth of ["auth-messi-pc", "auth-messi-notebook"]) {
        const decision = checkJoin({ name: "Messi", auth, directory: dir, bracketPlayers: ROSTER });

        assert.equal(decision.action, "allow");
        assert.equal(decision.profile.profileId, 1);
    }
});

test("entrada: suplantación de un nombre reservado con otro auth o sin auth", () => {
    const dir = directory();

    for (const auth of ["auth-impostor", null, undefined]) {
        const decision = checkJoin({ name: "messi", auth, directory: dir, bracketPlayers: ROSTER });

        assert.equal(decision.action, "kick");
        assert.match(decision.message, /reservado/);
    }
});

test("entrada: un jugador reconocido no puede usar el nombre de otro perfil", () => {
    const dir = directory();
    const decision = checkJoin({
        name: "Dibu Martínez",
        auth: "auth-messi-pc",
        directory: dir,
        bracketPlayers: ROSTER
    });

    assert.equal(decision.action, "kick");
});

test("entrada: un jugador reconocido tampoco puede usar el nombre de un inscripto sin cuenta", () => {
    const dir = directory();
    const decision = checkJoin({
        name: "Pablo",
        auth: "auth-messi-pc",
        directory: dir,
        bracketPlayers: ROSTER
    });

    assert.equal(decision.action, "kick");
    assert.match(decision.message, /inscripto/);
});

test("entrada: un jugador reconocido puede usar un nombre libre", () => {
    const dir = directory();
    const decision = checkJoin({
        name: "La Pulga",
        auth: "auth-messi-pc",
        directory: dir,
        bracketPlayers: ROSTER
    });

    assert.equal(decision.action, "allow");
    assert.equal(decision.profile.name, "Messi");
});

test("entrada: sin cuenta, un nombre libre o de un inscripto sin cuenta sigue como antes", () => {
    const dir = directory();

    for (const name of ["Cualquiera", "Pablo"]) {
        const decision = checkJoin({ name, auth: "auth-x", directory: dir, bracketPlayers: ROSTER });

        assert.deepEqual(decision, { action: "allow", profile: null });
    }
});

test("entrada: un perfil recién creado (sin navegador vinculado) todavía no reserva su nombre", () => {
    const dir = directory();
    const decision = checkJoin({ name: "Tito", auth: "auth-tito", directory: dir, bracketPlayers: ROSTER });

    assert.equal(decision.action, "allow");
    assert.equal(decision.profile, null);
});

test("entrada: la fila de un jugador verificado también queda reservada aunque el nombre difiera del perfil", () => {
    const dir = directory();

    // La fila "Leo" está vinculada a mano al perfil 1 (Messi).
    const decision = checkJoin({ name: "Leo", auth: "auth-impostor", directory: dir, bracketPlayers: ROSTER });

    assert.equal(decision.action, "kick");

    // Y el dueño sí puede usarla.
    const owner = checkJoin({ name: "Leo", auth: "auth-messi-pc", directory: dir, bracketPlayers: ROSTER });

    assert.equal(owner.action, "allow");
});

test("fila del torneo: el reconocido usa SU fila, no la que se llame igual que su nombre en la sala", () => {
    const dir = directory();
    const profile = dir.getByAuth("auth-messi-pc");

    // Entra como "Pablo" (no puede, pero la resolución no debe confundirse igual).
    const row = resolveRosterPlayer(ROSTER, { name: "Pablo", profile, directory: dir });

    assert.equal(row.id, 10);
});

test("fila del torneo: sin vínculo manual sirve la fila sin cuenta que se llama como el perfil", () => {
    const dir = directory();
    const profile = dir.getByAuth("auth-dibu");
    const withoutLink = [{ id: 11, name: "Dibu Martinez", profile_id: null }];

    assert.equal(resolveRosterPlayer(withoutLink, { name: "x", profile, directory: dir }).id, 11);
    assert.equal(resolveRosterPlayer([], { name: "x", profile, directory: dir }), null);
});

test("fila del torneo: sin cuenta no puede jugar la fila de un jugador verificado", () => {
    const dir = directory();

    assert.equal(resolveRosterPlayer(ROSTER, { name: "Messi", directory: dir }), null);
    assert.equal(resolveRosterPlayer(ROSTER, { name: "pablo", directory: dir }).id, 12);
    // Perfil pendiente (sin navegador vinculado): la fila todavía se juega por nombre.
    assert.equal(resolveRosterPlayer(ROSTER, { name: "Tito", directory: dir }).id, 14);
    assert.equal(resolveRosterPlayer(ROSTER, { name: "Nadie", directory: dir }), null);
});
