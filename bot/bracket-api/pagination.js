import { api } from "./api.js";

const PAGE_SIZE = 100;

// Bracket pagina los listados (25 por defecto, 100 como máximo por página).
// Sin esto el bot solo veía los primeros 25 jugadores/equipos del torneo.
export async function fetchAllPages(url, collectionKey) {
    const items = [];
    let offset = 0;

    while (true) {
        const { data } = await api.get(url, {
            params: { limit: PAGE_SIZE, offset }
        });

        const page = data?.data?.[collectionKey] ?? [];
        const total = data?.data?.count ?? page.length;

        items.push(...page);
        offset += PAGE_SIZE;

        if (page.length === 0 || items.length >= total) break;
    }

    return items;
}
