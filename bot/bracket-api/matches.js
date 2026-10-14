import { api } from "./api.js";

export async function obtenerPartido(tournamentId, matchId) {
    const { data } = await api.get(
        `/tournaments/${tournamentId}/matches/${matchId}`
    );

    return data?.data ?? null;
}

export async function actualizarPartido(
    tournamentId,
    matchId,
    partido
) {
    const { data } = await api.put(
        `/tournaments/${tournamentId}/matches/${matchId}`,
        partido
    );

    return data;
}

export async function finalizarPartido(
    tournamentId,
    matchId,
    resultado
) {
    const { data } = await api.post(
        `/tournaments/${tournamentId}/matches/${matchId}/finish`,
        resultado
    );

    return data;
}

export async function resetearPartido(
    tournamentId,
    matchId
) {
    const { data } = await api.post(
        `/tournaments/${tournamentId}/matches/${matchId}/reset`,
        {}
    );

    return data;
}