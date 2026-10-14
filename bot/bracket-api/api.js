import axios from "axios";

const API_BASE_URL =
    process.env.BRACKET_API_URL || "https://api.bracketapp.nl";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Token JWT de Bracket
let accessToken = null;

export function setAccessToken(token) {
    accessToken = token;
}

export function clearAccessToken() {
    accessToken = null;
}

// Agrega automáticamente el JWT a las peticiones
api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Se recuerda con qué token salió la petición (ver re-login más abajo).
    config._tokenUsed = accessToken;

    return config;
});

// Re-login automático: el JWT de Bracket vence (1 semana por defecto) y el bot puede
// estar encendido más tiempo que eso. auth.js registra acá la función de login.
let reauthHandler = null;
let reauthInFlight = null;

export function setReauthHandler(handler) {
    reauthHandler = handler;
}

// Manejo centralizado de errores
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (
            error.response?.status === 401 &&
            reauthHandler &&
            original &&
            !original._reauthTried &&
            !original.url?.endsWith("/token")
        ) {
            original._reauthTried = true;

            try {
                // Si el token ya se renovó mientras esta petición estaba en vuelo,
                // alcanza con reintentar. Si no, se hace un único login compartido.
                if (original._tokenUsed === accessToken) {
                    reauthInFlight ??= reauthHandler().finally(() => {
                        reauthInFlight = null;
                    });

                    await reauthInFlight;

                    console.log("Sesión de Bracket renovada.");
                }

                // El interceptor de request vuelve a poner el token nuevo.
                return api.request(original);
            } catch (reauthError) {
                console.error("No se pudo renovar la sesión de Bracket:", reauthError.message);
            }
        }

        if (error.response) {
            console.error(
                `Bracket API ${error.response.status}:`,
                error.response.data
            );
        } else {
            console.error("No se pudo conectar con Bracket:", error.message);
        }

        return Promise.reject(error);
    }
);

export function getApiErrorMessage(
    error,
    fallback = "Ocurrió un error comunicándose con Bracket."
) {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return "No se pudo conectar con el servidor de Bracket.";
        }

        const data = error.response.data;

        return (
            data?.detail ||
            data?.message ||
            data?.error ||
            fallback
        );
    }

    return fallback;
}