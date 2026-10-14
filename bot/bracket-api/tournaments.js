import { api } from "./api.js";

export async function obtenerTorneo(tournamentId) {
    const { data } = await api.get(
        `/tournaments/${tournamentId}`
    );

    return data;
}

export async function obtenerTorneos() {
    const { data } = await api.get("/tournaments");

    return Array.isArray(data) ? data : [];
}