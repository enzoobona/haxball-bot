import { api } from "./api.js";
import { fetchAllPages } from "./pagination.js";

export async function obtenerJugadores(tournamentId) {
    return fetchAllPages(
        `/tournaments/${tournamentId}/players`,
        "players"
    );
}

export async function crearJugador(tournamentId, jugador) {
    const { data } = await api.post(
        `/tournaments/${tournamentId}/players`,
        jugador
    );

    return data;
}

export async function agregarEstadisticasJugador(
    tournamentId,
    playerId,
    goals,
    assists
) {
    const { data } = await api.post(
        `/tournaments/${tournamentId}/players/${playerId}/stats/increment`,
        {
            goals,
            assists
        }
    );

    return data;
}