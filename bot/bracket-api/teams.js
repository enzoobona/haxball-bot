import { api } from "./api.js";
import { fetchAllPages } from "./pagination.js";

export async function obtenerEquipos(tournamentId) {
    return fetchAllPages(
        `/tournaments/${tournamentId}/teams`,
        "teams"
    );
}

export async function crearEquipo(tournamentId, equipo) {
    const { data } = await api.post(
        `/tournaments/${tournamentId}/teams`,
        equipo
    );

    return data;
}