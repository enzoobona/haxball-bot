import "dotenv/config";
import { login } from "./bracket-api/auth.js";
import { agregarEstadisticasJugador } from "./bracket-api/players.js";

await login();

const resultado = await agregarEstadisticasJugador(
    1, // tournamentId
    1, // playerId
    3, // goals
    2  // assists
);

console.log(resultado);