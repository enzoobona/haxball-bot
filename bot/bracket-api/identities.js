import { api } from "./api.js";

// Lista auth -> jugador con cuenta. El bot la cachea para reconocer a cada jugador que entra.
export async function obtenerIdentidades() {
    const { data } = await api.get("/haxball/identities");

    return Array.isArray(data?.data) ? data.data : [];
}

// Confirma un "!vincular CODIGO": el servidor valida el código (un solo uso, vence en minutos)
// y guarda auth <-> jugador. Lanza si el código no sirve.
export async function vincularHaxball(code, auth) {
    const { data } = await api.post("/haxball/link", { code, auth });

    return data?.data ?? null;
}
