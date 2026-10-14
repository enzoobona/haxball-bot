import fs from "node:fs";

import { normalizeName } from "./authStore.js";

// Camisetas y emojis de los equipos. Se resuelven en este orden de prioridad:
//   1. Lo que está cargado en Bracket (colores, color del texto, ángulo y emoji del equipo).
//   2. teams-config.json (respaldo / estilos predefinidos de países).
//   3. Un estilo generado de forma determinística a partir del nombre.
//
// Cada campo se resuelve por separado: si en Bracket solo se cargó el emoji, los colores salen
// de teams-config.json (o se generan) y el emoji sale de Bracket.

const DEFAULT_FLAG = "🏳️";

function parseColor(value, fallback = 0xFFFFFF) {
    if (typeof value === "number") return value;

    const match = /^#?([0-9a-f]{6})$/i.exec(String(value ?? "").trim());

    return match ? Number.parseInt(match[1], 16) : fallback;
}

function isValidColor(value) {
    return /^#?[0-9a-f]{6}$/i.test(String(value ?? "").trim());
}

export function loadTeamConfig(filePath) {
    let raw;

    try {
        raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
        return [];
    }

    return (raw?.teams ?? [])
        .filter(team => team?.name)
        .map(team => ({
            nombre: normalizeName(team.name),
            angle: Number(team.angle ?? 180),
            textColor: parseColor(team.textColor, 0xFFFFFF),
            colors: (team.colors?.length ? team.colors : ["#FFFFFF"])
                .slice(0, 3)
                .map(color => parseColor(color)),
            bandera: team.flag ?? DEFAULT_FLAG
        }));
}

function hashString(value) {
    let hash = 2166136261;

    for (const char of value) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(hash, 16777619) >>> 0;
    }

    return hash >>> 0;
}

function hslToHex(h, s, l) {
    const saturation = s / 100;
    const lightness = l / 100;
    const k = n => (n + h / 30) % 12;
    const a = saturation * Math.min(lightness, 1 - lightness);
    const f = n => lightness - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toByte = value => Math.round(value * 255);

    return (toByte(f(0)) << 16) | (toByte(f(8)) << 8) | toByte(f(4));
}

function luminance(hex) {
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;

    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Negro o blanco, el que mejor se lee sobre el color de la camiseta.
export function readableTextColor(shirtColor) {
    return luminance(shirtColor) > 0.55 ? 0x000000 : 0xFFFFFF;
}

export function generateStyle(name) {
    const normalized = normalizeName(name);
    const hue = hashString(normalized) % 360;
    const shirt = hslToHex(hue, 70, 45);

    return {
        nombre: normalized,
        angle: 180,
        textColor: readableTextColor(shirt),
        colors: [shirt],
        bandera: DEFAULT_FLAG
    };
}

// Combina el estilo base (teams-config.json o generado) con lo que se cargó en Bracket.
export function applyBracketStyle(base, bracketTeam) {
    const style = { ...base, colors: [...base.colors] };

    const bracketColors = [
        bracketTeam.shirt_color_1,
        bracketTeam.shirt_color_2,
        bracketTeam.shirt_color_3
    ]
        .filter(isValidColor)
        .map(color => parseColor(color));

    if (bracketColors.length > 0) {
        style.colors = bracketColors;

        // El ángulo solo tiene sentido junto a los colores: sin colores en Bracket se conserva
        // el del estilo base (por ejemplo, las franjas horizontales de teams-config.json).
        if (Number.isFinite(bracketTeam.shirt_angle)) {
            style.angle = bracketTeam.shirt_angle;
        }

        // Cambiaron los colores, así que el texto del estilo base podría no leerse:
        // se calcula uno legible salvo que Bracket traiga el suyo.
        style.textColor = readableTextColor(bracketColors[0]);
    }

    if (isValidColor(bracketTeam.shirt_text_color)) {
        style.textColor = parseColor(bracketTeam.shirt_text_color);
    }

    if (typeof bracketTeam.emoji === "string" && bracketTeam.emoji.trim() !== "") {
        style.bandera = bracketTeam.emoji.trim();
    }

    return style;
}

export function createTeamStyles(configured = []) {
    const configuredByName = new Map(
        configured.map(style => [style.nombre, style])
    );

    let bracketByName = new Map();
    let cache = new Map();

    return {
        // Equipos tal como los devuelve Bracket (con shirt_color_1..3, shirt_text_color,
        // shirt_angle y emoji). Define qué nombres son válidos y sus estilos propios.
        setBracketTeams(teams) {
            bracketByName = new Map(
                teams.map(team => [normalizeName(team.name), team])
            );
            cache = new Map();
        },

        // Atajo para quien solo conoce los nombres.
        setKnownTeams(names) {
            this.setBracketTeams(names.map(name => ({ name })));
        },

        // Devuelve el estilo, o undefined si el equipo no es ni configurado ni de Bracket.
        getCountry(name) {
            if (!name) return undefined;

            const key = normalizeName(name);

            if (cache.has(key)) return cache.get(key);

            const bracketTeam = bracketByName.get(key);
            const configuredStyle = configuredByName.get(key);

            if (!bracketTeam && !configuredStyle) return undefined;

            const base = configuredStyle ?? generateStyle(key);
            const style = bracketTeam ? applyBracketStyle(base, bracketTeam) : base;

            cache.set(key, style);

            return style;
        },

        configuredNames() {
            return [...configuredByName.keys()];
        }
    };
}
