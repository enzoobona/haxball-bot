import { api, setAccessToken, setReauthHandler } from "./api.js";

export async function login() {
    const response = await api.post(
        "/token",
        new URLSearchParams({
            username: process.env.BRACKET_USERNAME,
            password: process.env.BRACKET_PASSWORD
        }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    const { access_token } = response.data;

    setAccessToken(access_token);

    return response.data;
}

// Si una petición recibe 401 (token vencido), api.js vuelve a loguearse con esto.
setReauthHandler(login);