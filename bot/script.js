import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import HaxballJS from "haxball.js";

import { login } from "./bracket-api/auth.js";
import { obtenerTorneo } from "./bracket-api/tournaments.js";
import { obtenerJugadores } from "./bracket-api/players.js";
import { obtenerEquipos } from "./bracket-api/teams.js";
import { obtenerPartido, finalizarPartido, resetearPartido } from "./bracket-api/matches.js";
import { obtenerIdentidades, vincularHaxball } from "./bracket-api/identities.js";
import { getApiErrorMessage } from "./bracket-api/api.js";

import { createAuthStore, normalizeName } from "./lib/authStore.js";
import { checkJoin, createIdentityDirectory, resolveRosterPlayer } from "./lib/identity.js";
import { createResultQueue, flushQueue, isAlreadyRegisteredError } from "./lib/resultQueue.js";
import { hasAdminAuthConfigured, loadSettings } from "./lib/settings.js";
import { createTeamStyles, loadTeamConfig } from "./lib/teamStyles.js";

// Un error dentro de un comando no debería tirar abajo la sala (Node, por defecto, cierra
// el proceso ante una promesa rechazada). Se registra y se sigue.
process.on("unhandledRejection", (reason) => {
    console.error("Promesa rechazada sin manejar:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Excepción no controlada:", error);
});

HaxballJS().then(async (HBInit) => {

    // =============================================================
    // SETTINGS / PERSISTENCIA
    // =============================================================

    const settings = loadSettings();

    const dataDir = path.resolve(settings.dataDir);
    const replaysDir = path.resolve(settings.replaysDir);

    // Resultados que no se pudieron enviar a Bracket (se reintentan solos).
    const resultQueue = createResultQueue(path.join(dataDir, "pending-results.json"));

    // Vincula nombres inscriptos SIN cuenta con su auth de Haxball (anti-suplantación local).
    const authStore = createAuthStore(path.join(dataDir, "auth-map.json"));

    // Jugadores CON cuenta: auth -> perfil, tal como lo guarda el servidor (se vincula con !vincular).
    const identityDirectory = createIdentityDirectory();

    // id de sala -> perfil de quien está conectado y fue reconocido por su auth.
    const roomProfiles = new Map();

    // Intentos fallidos de !vincular por jugador (se expulsa al llegar a 5).
    const linkFailures = new Map();
    // Haxball solo entrega player.auth en onPlayerJoin (no en onPlayerChat), así que se guarda acá.
    const authByPlayerId = new Map();

    // La sala se crea más abajo, pero Bracket se carga antes: se guarda acá para poder consultarla.
    let roomInstance = null;

    // Camisetas: teams-config.json + estilo generado para cualquier otro equipo de Bracket.
    const teamStyles = createTeamStyles(
        loadTeamConfig(fileURLToPath(new URL("./teams-config.json", import.meta.url)))
    );

    // =============================================================
    // BRACKET
    // =============================================================

    let bracketPlayers = [];
    let bracketTeams = [];

    // teamId de Bracket -> Set con los playerId inscriptos en ese equipo.
    let teamRosters = new Map();

    let tournamentId;

    // Trae jugadores y equipos (con sus integrantes) y los deja en memoria.
    async function refreshBracketData() {
        const [players, teamsData] = await Promise.all([
            obtenerJugadores(tournamentId),
            obtenerEquipos(tournamentId)
        ]);

        bracketPlayers = players;
        bracketTeams = teamsData;

        teamRosters = new Map(
            teamsData.map(team => [
                team.id,
                new Set((team.players ?? []).map(teamPlayer => teamPlayer.id))
            ])
        );

        teamStyles.setBracketTeams(teamsData);

        await refreshIdentities();
    }

    // Trae la lista auth -> perfil. Si falla (por ejemplo, un Bracket sin esta función), se
    // conserva la anterior y el bot sigue funcionando como antes para quien no tiene cuenta.
    async function refreshIdentities() {
        try {
            identityDirectory.load(await obtenerIdentidades());
        } catch (error) {
            console.warn(
                "No se pudo traer las identidades de jugadores con cuenta " +
                `(las cuentas vinculadas no se reconocen hasta el próximo refresco): ${error.message}`
            );
        }

        // Quien ya está en la sala puede haberse vinculado (o desvinculado) desde la web.
        for (const current of roomInstance?.getPlayerList() ?? []) {
            attachProfile(current);
        }
    }

    function attachProfile(player) {
        const profile = identityDirectory.getByAuth(authByPlayerId.get(player.id) ?? player.auth);

        if (profile) {
            roomProfiles.set(player.id, profile);
        } else {
            roomProfiles.delete(player.id);
        }

        return profile;
    }

    try {
        await login();

        tournamentId = process.env.BRACKET_TOURNAMENT_ID;

        console.log("Conectado a Bracket.");

        const torneo = await obtenerTorneo(tournamentId);

        console.log("Torneo:", torneo?.data?.name ?? torneo);

        await refreshBracketData();

        console.log(
            `Bracket: ${bracketPlayers.length} jugadores y ${bracketTeams.length} equipos cargados.`
        );

    } catch (error) {
        console.error("Error inicializando Bracket:", error);
        process.exit(1);
    }

    // Fila de Bracket que corresponde a un jugador de la sala: la vinculada a su cuenta si fue
    // reconocido; si no, la que se llama igual (jugadores sin cuenta).
    function findBracketPlayer(player, profile = roomProfiles.get(player.id) ?? null) {
        return resolveRosterPlayer(bracketPlayers, {
            name: player.name,
            profile,
            directory: identityDirectory
        });
    }

    function getBracketPlayerId(player, profile) {
        return findBracketPlayer(player, profile)?.id ?? null;
    }

    // Arma las estadísticas que se mandan a Bracket. Un jugador que no se pueda
    // identificar NO bloquea el resultado del partido: se omite y se avisa.
    function buildMatchPlayerStats(finalStats, match) {
        if (!match) {
            throw new Error(
                "No hay un partido de Bracket cargado."
            );
        }

        const playerStats = [];
        const skipped = [];
        const seen = new Set();

        for (const stat of finalStats) {
            const bracketPlayerId = getBracketPlayerId(stat.player, stat.profile);

            if (bracketPlayerId === null) {
                skipped.push(stat.player.name);
                continue;
            }

            if (
                stat.teamId !== match.team_1_id &&
                stat.teamId !== match.team_2_id
            ) {
                skipped.push(stat.player.name);
                continue;
            }

            if (seen.has(bracketPlayerId)) continue;

            seen.add(bracketPlayerId);

            playerStats.push({
                player_id: bracketPlayerId,
                team_id: stat.teamId,
                goals: stat.goals,
                assists: stat.assists
            });
        }

        return { playerStats, skipped };
    }

    async function getMatch(matchId) {
        try {
            return await obtenerPartido(
                tournamentId,
                matchId
            );
        } catch (error) {
            console.error(
                `Error obteniendo partido número: ${matchId}`,
                error
            );

            return null;
        }
    }

    function sendResultToBracket(entry) {
        return finalizarPartido(
            entry.tournamentId,
            entry.matchId,
            entry.body
        );
    }

    // Reintenta los resultados que quedaron pendientes (Bracket caído, sin internet, etc.).
    let flushingQueue = false;

    async function retryPendingResults() {
        if (flushingQueue || resultQueue.size() === 0) return null;

        flushingQueue = true;

        try {
            const result = await flushQueue(resultQueue, sendResultToBracket);

            for (const matchId of [...result.sent, ...result.alreadyRegistered]) {
                console.log(`Resultado pendiente del partido #${matchId} registrado en Bracket.`);

                room.sendAnnouncement(
                    `✅ Partido #${matchId} registrado en Bracket (reintento automático).`,
                    null,
                    0xFFFFFF,
                    "bold"
                );
            }

            return result;
        } finally {
            flushingQueue = false;
        }
    }

    // ============================================================
    // ROOM
    // ============================================================

    const roomConfig = {
        roomName: settings.roomName,
        public: settings.roomPublic,
        maxPlayers: settings.maxPlayers,
        noPlayer: true,
        token: process.env.HAXBALL_TOKEN
    };

    if (settings.roomPassword) roomConfig.password = settings.roomPassword;

    const room = HBInit(roomConfig);

    roomInstance = room;

    room.setDefaultStadium("Big");
    room.setScoreLimit(0);
    room.setTimeLimit(0);

    // Si el token de Haxball venció o es inválido, la sala nunca recibe link.
    // Se corta con un mensaje claro en lugar de quedar colgado sin avisar.
    const roomLinkWatchdog = setTimeout(() => {
        console.error(
            "No se recibió el link de la sala. El HAXBALL_TOKEN venció o es inválido: " +
            "generá uno nuevo en https://www.haxball.com/headlesstoken y reiniciá el bot."
        );

        process.exit(2);
    }, settings.roomLinkTimeoutSeconds * 1000);

    room.onRoomLink = (link) => {
        clearTimeout(roomLinkWatchdog);

        console.log(`Sala: ${link}`);
    };

    // Datos de Bracket al día y resultados pendientes: tareas periódicas.
    setInterval(() => {
        refreshBracketData().catch(error => {
            console.error("No se pudo refrescar Bracket:", error.message);
        });
    }, settings.refreshMinutes * 60 * 1000);

    setInterval(() => {
        retryPendingResults().catch(error => {
            console.error("Error reintentando resultados pendientes:", error);
        });
    }, settings.retrySeconds * 1000);

    retryPendingResults().catch(error => {
        console.error("Error reintentando resultados pendientes:", error);
    });

    // ============================================================
    // CONFIGURATION
    // ============================================================

    const prefijo = "!";
    const halfTimeDuration = 15000;

    let halfTime = 30;

    // Overtime (muerte súbita) en eliminación directa, en segundos.
    const overtimeSeconds = settings.overtimeSeconds;

    const stadiums = {
        big: { type: "default", value: "Big" },
        small: { type: "default", value: "Small" },
        classic: { type: "default", value: "Classic" },
        hockey: { type: "default", value: "Hockey" }
    };

    // ============================================================
    // MATCH STATE
    // ============================================================

    let currentHalf = 0;
    let halfRunning = false;
    let halftimeTimer = null;
    let finishingMatch = false;
    let swappingTeams = false;
    let currentMatch;

    // currentHalf: 0 = sin juego, 1 = primer tiempo, 2 = segundo tiempo, 3 = muerte súbita.
    let overtimeTimer = null;
    let overtimeEnding = false;

    let isRecording = false;

    // Jugadores silenciados: clave (auth o id) -> timestamp (ms) hasta cuándo.
    const mutedUntil = new Map();

    // Intentos fallidos de !admin por jugador (se expulsa al llegar a 5).
    const adminFailures = new Map();

    // teams = orden original del partido.
    let teams = [];

    // fieldTeams = equipo actualmente en RED / BLUE.
    let fieldTeams = [];

    // score = marcador siguiendo SIEMPRE el orden original.
    let score = [0, 0];

    // captainIds = capitán de cada equipo siguiendo el orden original.
    let captainIds = [null, null];

    // ============================================================
    // PLAYER STATE
    // ============================================================

    let playerList = [];
    let playingPlayerList = [];

    // ============================================================
    // TOUCH STATE
    // ============================================================

    let lastTouch = null;
    let secondToLastTouch = null;

    // ============================================================
    // STATISTICS
    // ============================================================

    let stats = [];

    // Se conserva el MVP del último partido para !mvp.
    let lastMatchMvp = null;

    // ============================================================
    // EVENTS
    // ============================================================

    const eventHandlers = {};

    function onEvent(eventName, handler) {
        if (!eventHandlers[eventName]) eventHandlers[eventName] = [];
        eventHandlers[eventName].push(handler);
    }

    function emitEvent(eventName, data = {}) {
        for (const handler of eventHandlers[eventName] ?? []) {
            handler(data);
        }
    }

    // ============================================================
    // GENERIC HELPERS
    // ============================================================

    function isAdmin(player) {
        return player.admin;
    }

    function requireAdmin(player) {
        if (isAdmin(player)) return true;

        room.sendAnnouncement(
            "❌ Este comando requiere permisos de administrador.",
            player.id,
            0xFF0000,
            "bold"
        );

        return false;
    }

    function requireArgCount(player, args, count, usage) {
        if (args.length === count) return true;

        room.sendAnnouncement(
            `❌ Uso: ${usage}`,
            player.id,
            0xFF0000,
            "bold"
        );

        return false;
    }

    function sendError(player, message) {
        room.sendAnnouncement(
            `❌ ${message}`,
            player.id,
            0xFF0000,
            "bold"
        );
    }

    // Estilo (colores + bandera) de un equipo: teams-config.json o generado desde Bracket.
    function getCountry(name) {
        return teamStyles.getCountry(name);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    function parseTime(value) {
        if (!value) return null;

        const input = value.toLowerCase();

        if (/^\d+$/.test(input)) {
            return Number(input);
        }

        if (/^\d+s$/.test(input)) {
            return Number(input.slice(0, -1));
        }

        if (/^\d+m$/.test(input)) {
            return Number(input.slice(0, -1)) * 60;
        }

        return null;
    }

    function getPlayerFromName(name) {
        if (!name) return undefined;

        // "#12" selecciona al jugador por su id de sala (sirve con nombres con espacios).
        if (/^#\d+$/.test(name.trim())) {
            return room.getPlayer(Number(name.trim().slice(1))) ?? undefined;
        }

        const normalizedName = name.trim().toLowerCase();

        const players = room
            .getPlayerList()
            .filter(player => player.name.toLowerCase() === normalizedName);

        if (players.length === 1) return players[0];
        if (players.length > 1) return null;

        return undefined;
    }

    // Separa "<jugador> <resto>" admitiendo: Nombre | "Nombre con espacios" | #id
    function splitNameArg(args) {
        const input = args.join(" ").trim();
        const quoted = /^"([^"]+)"\s*(.*)$/.exec(input);

        if (quoted) return { name: quoted[1], rest: quoted[2].trim() };

        const [name, ...rest] = input.split(/\s+/);

        return { name, rest: rest.join(" ").trim() };
    }

    // Busca un jugador de la sala y, si no se puede, le explica al admin por qué.
    function resolvePlayer(requester, name) {
        const target = getPlayerFromName(name);

        if (target === undefined) {
            sendError(requester, `No existe un jugador llamado "${name}".`);
            return null;
        }

        if (target === null) {
            sendError(requester, "Hay más de un jugador con ese nombre. Usá #id (mirá !players).");
            return null;
        }

        return target;
    }

    function playerKey(player) {
        return player.auth || `id:${player.id}`;
    }

    function getPlayerStats(player) {
        return stats.find(stat => stat.player.id === player.id);
    }

    function getOriginalTeamIndex(teamNumber) {
        const fieldTeam = fieldTeams[teamNumber - 1];

        return teams.indexOf(fieldTeam);
    }

    function getShirtColor(teamNumber) {
        const country = getCountry(fieldTeams[teamNumber - 1]);

        return country?.colors.at(0) ?? 0xFFFFFF;
    }

    // ============================================================
    // ADMINS
    // ============================================================

    function grantAdminIfListed(player) {
        if (player.auth && settings.adminAuths.includes(player.auth)) {
            room.setPlayerAdmin(player.id, true);
        }
    }

    function updateAdmins() {
        // Con ADMIN_PASSWORD / ADMIN_AUTHS configurados, el primero que entra NO es admin.
        if (hasAdminAuthConfigured(settings)) return;

        const players = room.getPlayerList();

        if (players.length === 0) return;

        if (players.find(player => player.admin) !== undefined) return;

        room.setPlayerAdmin(players[0].id, true);
    }

    // ============================================================
    // PLAYER LISTS
    // ============================================================

    function updatePlayerList() {
        playerList = room.getPlayerList();
        playingPlayerList = playerList.filter(player => player.team !== 0);
    }

    // ============================================================
    // STATS
    // ============================================================

    // teamId de Bracket del equipo que hoy juega en RED (1) o BLUE (2).
    // Se calcula con el orden ORIGINAL del partido: después del entretiempo los equipos
    // cambian de lado y "RED" pasa a ser el segundo equipo.
    function getFieldTeamBracketId(teamNumber) {
        if (!currentMatch) return null;

        const originalIndex = getOriginalTeamIndex(teamNumber);

        if (originalIndex === 0) return currentMatch.team_1_id;
        if (originalIndex === 1) return currentMatch.team_2_id;

        return null;
    }

    function generateStats(player) {
        // Sin partido de Bracket (amistoso) no hay estadísticas para enviar.
        if (!currentMatch) return;

        const teamId = getFieldTeamBracketId(player.team);

        if (teamId === null) return;

        if (
            stats.some(stat =>
                stat.player &&
                stat.player.id === player.id
            )
        ) {
            return;
        }

        stats.push({
            player,
            // Se guarda acá porque el jugador puede irse de la sala antes de que termine el partido.
            profile: roomProfiles.get(player.id) ?? null,
            teamId,
            goals: 0,
            assists: 0
        });
    }

    function resetStats() {
        stats = [];

        updatePlayerList();

    }

    function resetPlayerStats(player) {
        const playerStats = stats.findIndex(
            stat => stat.player.id === player.id
        );

        if (playerStats === -1) return;

        stats.splice(playerStats, 1);
    }

    function playerScore(player) {
        const stat = getPlayerStats(player);

        if (!stat) return;

        stat.goals++;
    }

    function playerAssist(player) {
        const stat = getPlayerStats(player);

        if (!stat) return;

        stat.assists++;
    }

    // ============================================================
    // SHIRTS / TEAMS
    // ============================================================

    function setTeamShirts(teamNumber, name) {
        const country = getCountry(name);

        if (!country) return false;

        room.setTeamColors(
            teamNumber,
            country.angle,
            country.textColor,
            country.colors
        );

        return true;
    }

    function setTeams(team1, team2) {
        const country1 = getCountry(team1);
        const country2 = getCountry(team2);

        if (!country1 || !country2) return false;
        if (country1.nombre === country2.nombre) return false;

        teams = [country1.nombre, country2.nombre];
        fieldTeams = [...teams];
        score = [0, 0];
        captainIds = [null, null];

        setTeamShirts(1, fieldTeams[0]);
        setTeamShirts(2, fieldTeams[1]);

        return true;
    }

    function swapShirts() {
        [fieldTeams[0], fieldTeams[1]] = [
            fieldTeams[1],
            fieldTeams[0]
        ];

        setTeamShirts(1, fieldTeams[0]);
        setTeamShirts(2, fieldTeams[1]);
    }

    // ============================================================
    // TEAM SWAP
    // ============================================================

    function swapTeams() {
        swappingTeams = true;
        
        const players = room
            .getPlayerList()
            .filter(player => player.team !== 0);

        const swaps = players.map(player => ({
            id: player.id,
            team: player.team
        }));

        for (const player of swaps) {
            room.setPlayerTeam(player.id, 0);
        }

        setTimeout(() => {
            for (const player of swaps) {
                const newTeam = player.team === 1 ? 2 : 1;

                room.setPlayerTeam(player.id, newTeam);
            }

            swapShirts();
            updatePlayerList();

            swappingTeams = false;
        }, 100);

    }

    // ============================================================
    // TOUCH STATE
    // ============================================================

    function resetLastTouch() {
        lastTouch = null;
        secondToLastTouch = null;
    }

    // ============================================================
    // GOALS
    // ============================================================

    function checkPlayerGoal(teamNumber) {
        if (lastTouch === null) return null;

        const player = room.getPlayer(lastTouch);

        if (!player) return null;

        if (player.team !== teamNumber) {
            return null;
        }

        playerScore(player);
        checkPlayerAssist(player);

        return player;
    }

    // Gol en contra: el último toque fue de un jugador del equipo que RECIBIÓ el gol.
    // Cuenta para el marcador del rival y se anuncia en la sala, pero NO es una estadística
    // del jugador (los jugadores no tienen goles en contra).
    function checkOwnGoal(teamNumber) {
        if (lastTouch === null) return null;

        const player = room.getPlayer(lastTouch);

        if (!player || player.team === 0 || player.team === teamNumber) return null;

        return player;
    }

    function checkPlayerAssist(player) {
        if (secondToLastTouch === null) return null;

        const assister = room.getPlayer(secondToLastTouch);

        if (!assister) return null;

        if (assister.id === player.id) return null;
        if (assister.team !== player.team) return null;

        playerAssist(assister);

        return assister;
    }

    // ============================================================
    // MATCH LIFECYCLE
    // ============================================================

    // ---- Replays: se guarda un .hbr2 por partido en la carpeta de replays ----

    function startRecording() {
        if (!settings.saveReplays || isRecording) return;

        try {
            room.startRecording();
            isRecording = true;
        } catch (error) {
            console.error("No se pudo iniciar la grabación del replay:", error.message);
        }
    }

    function stopRecording(saveAs = null) {
        if (!isRecording) return;

        isRecording = false;

        try {
            const data = room.stopRecording();

            if (!saveAs || !data) return;

            fs.mkdirSync(replaysDir, { recursive: true });

            const stamp = new Date().toISOString().replace(/[:.]/g, "-");
            const file = path.join(replaysDir, `${saveAs}-${stamp}.hbr2`);

            fs.writeFileSync(file, data);

            console.log("Replay guardado:", file);
        } catch (error) {
            console.error("No se pudo guardar el replay:", error.message);
        }
    }

    // ---- Muerte súbita ----

    function clearOvertime() {
        clearTimeout(overtimeTimer);

        overtimeTimer = null;
        overtimeEnding = false;
    }

    // En eliminación directa no puede haber empate: se juega a gol de oro.
    function needsTiebreak() {
        return Boolean(currentMatch)
            && String(currentMatch.stage_type ?? "").toUpperCase() === "SINGLE_ELIMINATION"
            && score[0] === score[1];
    }

    function startOvertime({ restart = false } = {}) {
        halfRunning = false;
        currentHalf = 3;

        room.stopGame();
        resetLastTouch();

        emitEvent("overtimeStart", { restart });

        clearTimeout(overtimeTimer);

        overtimeTimer = setTimeout(() => {
            overtimeTimer = null;

            if (currentHalf !== 3) return;

            halfRunning = true;
            room.startGame();
        }, 3000);
    }

    function startFirstHalf() {
        clearTimeout(halftimeTimer);
        clearOvertime();

        currentHalf = 1;
        halfRunning = true;

        fieldTeams = [...teams];
        score = [0, 0];
        captainIds = [null, null];

        setTeamShirts(1, fieldTeams[0]);
        setTeamShirts(2, fieldTeams[1]);

        resetLastTouch();
        
        for(const player of playingPlayerList) {
            generateStats(player);
        }

        startRecording();

        room.startGame();

        emitEvent("matchStart", {
            half: 1
        });
    }

    function startSecondHalf() {
        currentHalf = 2;
        halfRunning = true;

        resetLastTouch();

        room.startGame();

        emitEvent("secondHalfStart", {
            half: 2
        });
    }

    function startHalftime() {
        halfRunning = false;
        currentHalf = 0;

        const halftimeScore = [...score];

        room.stopGame();
        resetLastTouch();

        emitEvent("halftime", {
            score: halftimeScore
        });

        swapTeams();

        halftimeTimer = setTimeout(() => {
            halftimeTimer = null;

            startSecondHalf();
        }, halfTimeDuration);
    }

    async function finishMatch() {
        if (finishingMatch) return;

        if (!currentMatch) {
            console.error(
                "No hay un partido de Bracket cargado."
            );
            return;
        }

        finishingMatch = true;

        const match = currentMatch;

        try {
            halfRunning = false;

            clearOvertime();

            room.stopGame();
            resetLastTouch();

            const finalScore = [...score];
            const finalStats = [...stats];

            lastMatchMvp = calculateMvp(finalStats);

            console.log("====================================");
            console.log("ESTADÍSTICAS DEL PARTIDO");

            for (const stat of finalStats) {
                console.log(
                    `${stat.player.name}: ` +
                    `${stat.goals} gol/es, ` +
                    `${stat.assists} asistencia/s`
                );
            }

            if (lastMatchMvp) {
                console.log(
                    `MVP: ${lastMatchMvp.player.name} ` +
                    `(${lastMatchMvp.points} puntos)`
                );
            }

            console.log("====================================");

            stopRecording(`partido-${match.id}`);

            // Un jugador inscripto hace pocos minutos todavía no está en memoria.
            if (finalStats.some(stat => getBracketPlayerId(stat.player, stat.profile) === null)) {
                try {
                    await refreshBracketData();
                } catch (error) {
                    console.error("No se pudo refrescar Bracket antes de cerrar:", error.message);
                }
            }

            const { playerStats, skipped } = buildMatchPlayerStats(finalStats, match);

            const entry = {
                matchId: match.id,
                tournamentId,
                body: {
                    stage_item_input1_score: finalScore[0],
                    stage_item_input2_score: finalScore[1],
                    player_stats: playerStats
                }
            };

            emitEvent("matchEnd", {
                score: finalScore,
                mvp: lastMatchMvp
            });

            try {
                await sendResultToBracket(entry);

                room.sendAnnouncement(
                    `✅ Partido #${match.id} registrado en Bracket.`,
                    null,
                    0xFFFFFF,
                    "bold"
                );
            } catch (error) {
                if (isAlreadyRegisteredError(error)) {
                    room.sendAnnouncement(
                        `✅ Partido #${match.id} ya estaba registrado en Bracket.`,
                        null,
                        0xFFFFFF,
                        "bold"
                    );
                } else {
                    // No se pierde: queda en disco y se reintenta solo (o con !reintentar).
                    console.error("Error enviando el resultado a Bracket:", error.message);

                    resultQueue.enqueue(entry, error?.response?.data?.detail ?? error.message);

                    room.sendAnnouncement(
                        `⚠️ No se pudo enviar el partido #${match.id} a Bracket. ` +
                        "Quedó guardado y se reintentará automáticamente.",
                        null,
                        0xFFAA00,
                        "bold"
                    );
                }
            }

            if (skipped.length > 0) {
                console.warn("Jugadores sin estadísticas (no inscriptos en Bracket):", skipped);

                room.sendAnnouncement(
                    `⚠️ Sin estadísticas por no estar inscriptos en Bracket: ${skipped.join(", ")}.`,
                    null,
                    0xFFAA00
                );
            }

            currentMatch = null;

            score = [0, 0];
            currentHalf = 0;

            resetStats();

            fieldTeams = [...teams];

            setTeamShirts(1, fieldTeams[0]);
            setTeamShirts(2, fieldTeams[1]);

        } catch (error) {
            console.error(
                "Error finalizando partido:",
                error
            );

            room.sendAnnouncement(
                "❌ Error finalizando el partido. Revisá la consola del bot.",
                null,
                0xFF0000,
                "bold"
            );

        } finally {
            finishingMatch = false;
        }
    }

    function stopMatch() {
        clearTimeout(halftimeTimer);
        halftimeTimer = null;

        clearOvertime();

        // Partido cancelado: se descarta la grabación.
        stopRecording();

        if (room.getScores()) {
            room.stopGame();
        }

        currentHalf = 0;
        halfRunning = false;

        resetLastTouch();

        score = [0, 0];
        captainIds = [null, null];

        fieldTeams = [...teams];

        if (fieldTeams.length === 2) {
            setTeamShirts(1, fieldTeams[0]);
            setTeamShirts(2, fieldTeams[1]);
        }

        resetStats();

        emitEvent("matchStop");
    }

    // ============================================================
    // MVP
    // ============================================================

    function calculateMvp(matchStats) {
        if (matchStats.length === 0) return null;

        const candidates = matchStats.map(stat => ({
            ...stat,
            points: stat.goals * 3 + stat.assists * 2
        }));

        candidates.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }

            if (b.goals !== a.goals) {
                return b.goals - a.goals;
            }

            return b.assists - a.assists;
        });

        const mvp = candidates[0];

        if (mvp.points === 0) return null;

        return mvp;
    }

    // ============================================================
    // INFORMATION COMMANDS
    // ============================================================

    function showScore(player) {
        if (teams.length < 2) {
            sendError(player, "Todavía no se definieron los equipos.");
            return;
        }

        room.sendAnnouncement(
            `⚽ ${getCountry(teams[0]).bandera} ${teams[0].toUpperCase()} ${score[0]} - ${score[1]} ${teams[1].toUpperCase()} ${getCountry(teams[1]).bandera}`,
            player.id,
            0xFFFFFF,
            "bold"
        );
    }

    function showTime(player) {
        const scores = room.getScores();

        if (!scores) {
            room.sendAnnouncement(
                "⏸️ No hay un partido en curso.",
                player.id,
                0xFFFF00
            );

            return;
        }

        const halfName = currentHalf === 1
            ? "PRIMER TIEMPO"
            : currentHalf === 3
                ? "MUERTE SÚBITA"
                : "SEGUNDO TIEMPO";

        room.sendAnnouncement(
            `⏱️ ${halfName} - ${formatTime(Math.floor(scores.time))}`,
            player.id,
            0xFFFFFF,
            "bold"
        );
    }

    function showTeams(player) {
        if (fieldTeams.length < 2) {
            sendError(player, "Todavía no se definieron los equipos.");
            return;
        }

        const redPlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 1);

        const bluePlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 2);

        const redCountry = getCountry(fieldTeams[0]);
        const blueCountry = getCountry(fieldTeams[1]);

        const redCaptainId = captainIds[teams.indexOf(fieldTeams[0])];
        const blueCaptainId = captainIds[teams.indexOf(fieldTeams[1])];

        const redNames = redPlayers.length > 0
            ? redPlayers.map(currentPlayer => {
                const captain = currentPlayer.id === redCaptainId ? "⭐ " : "";
                return `${captain}${currentPlayer.name}`;
            }).join(", ")
            : "Vacío";

        const blueNames = bluePlayers.length > 0
            ? bluePlayers.map(currentPlayer => {
                const captain = currentPlayer.id === blueCaptainId ? "⭐ " : "";
                return `${captain}${currentPlayer.name}`;
            }).join(", ")
            : "Vacío";

        room.sendAnnouncement(
            `${redCountry.bandera} ${redCountry.nombre.toUpperCase()}: ${redNames}`,
            player.id,
            0xFFFFFF,
            "bold"
        );

        room.sendAnnouncement(
            `${blueCountry.bandera} ${blueCountry.nombre.toUpperCase()}: ${blueNames}`,
            player.id,
            0xFFFFFF,
            "bold"
        );
    }

    function showLineup(player) {
        const redPlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 1);

        const bluePlayers = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 2);

        const spectators = room
            .getPlayerList()
            .filter(currentPlayer => currentPlayer.team === 0);

        const redCountry = getCountry(fieldTeams[0]);
        const blueCountry = getCountry(fieldTeams[1]);

        room.sendAnnouncement(
            `${redCountry?.bandera ?? "🔴"} ${redCountry?.nombre?.toUpperCase() ?? "RED"}: ${redPlayers.map(currentPlayer => currentPlayer.name).join(", ") || "Vacío"}`,
            player.id,
            0xFFFFFF
        );

        room.sendAnnouncement(
            `${blueCountry?.bandera ?? "🔵"} ${blueCountry?.nombre?.toUpperCase() ?? "BLUE"}: ${bluePlayers.map(currentPlayer => currentPlayer.name).join(", ") || "Vacío"}`,
            player.id,
            0xFFFFFF
        );

        room.sendAnnouncement(
            `👀 ESPECTADORES: ${spectators.map(currentPlayer => currentPlayer.name).join(", ") || "Ninguno"}`,
            player.id,
            0xFFFFFF
        );
    }

    function showStats(player) {
        if (stats.length === 0) {
            sendError(player, "No hay estadísticas.");
            return;
        }

        const orderedStats = [...stats].sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            return b.assists - a.assists;
        });

        room.sendAnnouncement(
            "📊 ESTADÍSTICAS",
            player.id,
            0xFFFFFF,
            "bold"
        );

        for (const stat of orderedStats) {
            room.sendAnnouncement(
                `${stat.player.name}: ⚽ ${stat.goals} | 🅰️ ${stat.assists}`,
                player.id,
                0xFFFFFF
            );
        }
    }

    function showMvp(player) {
        if (!lastMatchMvp) {
            const currentMvp = calculateMvp(stats);

            if (!currentMvp) {
                sendError(player, "Todavía no hay un MVP.");
                return;
            }

            lastMatchMvp = currentMvp;
        }

        room.sendAnnouncement(
            `🏆 MVP: ${lastMatchMvp.player.name.toUpperCase()} - ⚽ ${lastMatchMvp.goals} | 🅰️ ${lastMatchMvp.assists} | ${lastMatchMvp.points} puntos`,
            player.id,
            0xFFD700,
            "bold"
        );
    }

    function showPlayers(player) {
        const players = room.getPlayerList();

        if (players.length === 0) {
            sendError(player, "No hay jugadores en la sala.");
            return;
        }

        room.sendAnnouncement(
            `👥 ${players.map(currentPlayer => `${currentPlayer.name} (#${currentPlayer.id})`).join(", ")}`,
            player.id,
            0xFFFFFF
        );
    }

    function showHelp(player) {
        room.sendAnnouncement(
            "📖 !score | !teams | !lineup | !time | !stats | !mvp | !players | !vincular CODIGO | !yo | !help",
            player.id,
            0xFFFFFF
        );

        if (player.admin) {
            room.sendAnnouncement(
                "🔧 Admin: !partido | !resetPartido | !iniciar | !stop | !pause | !resume | !camisetas | !tiempo | !estadio | !sub | !captain",
                player.id,
                0xFFFF00
            );

            room.sendAnnouncement(
                "🛡️ Moderación: !kick | !ban | !clearbans | !mute | !unmute | !desvincular | !actualizar | !pendientes | !reintentar  (jugadores: nombre, \"nombre con espacios\" o #id)",
                player.id,
                0xFFFF00
            );
        }
    }

    // ============================================================
    // ADMIN COMMANDS
    // ============================================================

    function setStadium(name) {
        const config = stadiums[name];

        if (!config) return false;

        if (config.type === "custom") {
            room.setCustomStadium(config.value);
        } else {
            room.setDefaultStadium(config.value);
        }

        return true;
    }

    function pauseMatch() {
        room.pauseGame(true);
        halfRunning = false;

        emitEvent("pause");
    }

    function resumeMatch() {
        room.pauseGame(false);
        halfRunning = true;

        emitEvent("resume");
    }

    function substitutePlayers(enteringPlayer, leavingPlayer) {
        const leavingTeam = leavingPlayer.team;

        room.setPlayerTeam(leavingPlayer.id, 0);

        room.setPlayerTeam(enteringPlayer.id, leavingTeam);

        updatePlayerList();

        emitEvent("substitution", {
            enteringPlayer,
            leavingPlayer
        });
    }

    function setCaptain(player) {
        if (player.team === 0) return false;

        const teamIndex = getOriginalTeamIndex(player.team);

        if (teamIndex === -1) return false;

        captainIds[teamIndex] = player.id;

        emitEvent("captain", {
            player,
            team: teams[teamIndex]
        });

        return true;
    }

    // ============================================================
    // EVENTS: DEFAULT HANDLERS
    // ============================================================

    onEvent("matchStart", () => {
        room.sendAnnouncement(
            "⚽ ¡COMIENZA EL PRIMER TIEMPO!",
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("secondHalfStart", () => {
        room.sendAnnouncement(
            "⚽ ¡COMIENZA EL SEGUNDO TIEMPO!",
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("halftime", ({ score: halftimeScore }) => {
        room.sendAnnouncement(
            "⏸️ ¡FIN DEL PRIMER TIEMPO!",
            null,
            0xFFFF00,
            "bold"
        );

        room.sendAnnouncement(
            `📊 PARCIAL: ${teams[0].toUpperCase()} ${halftimeScore[0]} - ${halftimeScore[1]} ${teams[1].toUpperCase()}`,
            null,
            0xFFFFFF,
            "bold"
        );

        room.sendAnnouncement(
            "🔄 Cambiando de lado...",
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("matchEnd", ({ score: finalScore, mvp }) => {
        room.sendAnnouncement(
            `🏁 ¡FINAL DEL PARTIDO! ${teams[0].toUpperCase()} ${finalScore[0]} - ${finalScore[1]} ${teams[1].toUpperCase()}`,
            null,
            0xFFD700,
            "bold"
        );

        if (mvp) {
            room.sendAnnouncement(
                `🏆 MVP: ${mvp.player.name.toUpperCase()} - ⚽ ${mvp.goals} | 🅰️ ${mvp.assists}`,
                null,
                0xFFD700,
                "bold"
            );
        }
    });

    onEvent("matchStop", () => {
        room.sendAnnouncement(
            "🛑 ¡PARTIDO DETENIDO!",
            null,
            0xFF0000,
            "bold"
        );
    });

    onEvent("pause", () => {
        room.sendAnnouncement(
            "⏸️ Partido pausado.",
            null,
            0xFFFF00,
            "bold"
        );
    });

    onEvent("resume", () => {
        room.sendAnnouncement(
            "▶️ Partido reanudado.",
            null,
            0x00FF00,
            "bold"
        );
    });

    onEvent("substitution", ({ enteringPlayer, leavingPlayer }) => {
        room.sendAnnouncement(
            `🔄 CAMBIO: entra ${enteringPlayer.name.toUpperCase()} por ${leavingPlayer.name.toUpperCase()}`,
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("captain", ({ player, team }) => {
        const country = getCountry(team);

        room.sendAnnouncement(
            `${country?.bandera ?? "⭐"} ${player.name.toUpperCase()} es ahora capitán de ${team.toUpperCase()}.`,
            null,
            0xFFFFFF,
            "bold"
        );
    });

    onEvent("goal", ({ teamNumber, scorer, assister }) => {
        const fieldTeam = fieldTeams[teamNumber - 1];
        const country = getCountry(fieldTeam);

        const scoreIndex = teams.indexOf(fieldTeam);

        score[scoreIndex]++;

        let message = `${country.bandera} ¡GOOOOOL DE ${scorer ? scorer.name.toUpperCase() : fieldTeam.toUpperCase()}!`;

        if (assister) {
            message += ` 🅰️ ${assister.name.toUpperCase()}`;
        }

        message += ` ¡EL PARTIDO VA ${teams[0].toUpperCase()} ${score[0]} - ${score[1]} ${teams[1].toUpperCase()}!`;

        room.sendAnnouncement(
            message,
            null,
            getShirtColor(teamNumber),
            "bold"
        );
    });

    onEvent("goalUnknownScorer", ({ teamNumber }) => {
        const fieldTeam = fieldTeams[teamNumber - 1];
        const country = getCountry(fieldTeam);

        const scoreIndex = teams.indexOf(fieldTeam);

        score[scoreIndex]++;

        room.sendAnnouncement(
            `${country.bandera} ¡GOOOOOL DE ${fieldTeam.toUpperCase()}! ¡EL PARTIDO VA ${teams[0].toUpperCase()} ${score[0]} - ${score[1]} ${teams[1].toUpperCase()}!`,
            null,
            getShirtColor(teamNumber),
            "bold"
        );
    });

    onEvent("ownGoal", ({ teamNumber, player }) => {
        const fieldTeam = fieldTeams[teamNumber - 1];
        const country = getCountry(fieldTeam);

        const scoreIndex = teams.indexOf(fieldTeam);

        score[scoreIndex]++;

        room.sendAnnouncement(
            `${country.bandera} 🥅 ¡GOL EN CONTRA DE ${player.name.toUpperCase()}! ¡EL PARTIDO VA ${teams[0].toUpperCase()} ${score[0]} - ${score[1]} ${teams[1].toUpperCase()}!`,
            null,
            getShirtColor(teamNumber),
            "bold"
        );
    });

    onEvent("overtimeStart", ({ restart }) => {
        room.sendAnnouncement(
            restart
                ? "⏱️ ¡Sigue la MUERTE SÚBITA! Nadie convirtió: se repite el período."
                : "⚖️ ¡EMPATE! En eliminación directa no puede haber empate: MUERTE SÚBITA, el primer gol gana.",
            null,
            0xFFD700,
            "bold"
        );
    });

    // ============================================================
    // ROOM EVENTS
    // ============================================================

    // ---- Planteles: solo juegan los inscriptos en el equipo del partido ----

    function isRosterAllowed(player) {
        if (!settings.enforceRosters || !currentMatch) return true;

        const teamId = getFieldTeamBracketId(player.team);

        // Equipos todavía sin definir: no hay contra qué validar.
        if (teamId === null) return true;

        const bracketPlayer = findBracketPlayer(player);

        if (!bracketPlayer) return false;

        return teamRosters.get(teamId)?.has(bracketPlayer.id) ?? false;
    }

    function denyRosterPlayer(player) {
        room.setPlayerTeam(player.id, 0);

        const fieldTeam = getCountry(fieldTeams[player.team - 1]);

        if (!findBracketPlayer(player)) {
            sendError(
                player,
                roomProfiles.has(player.id)
                    ? "Tu cuenta no está vinculada a ningún jugador inscripto en este torneo. Podés mirar el partido."
                    : "Tu nombre no coincide con ningún jugador inscripto en Bracket. Podés mirar el partido."
            );

            return;
        }

        sendError(
            player,
            `No estás inscripto en ${fieldTeam?.nombre?.toUpperCase() ?? "ese equipo"}.`
        );
    }

    // Revisa a todos los que ya están en la cancha (se usa al cargar el partido y al iniciar).
    function enforceRosters() {
        if (!settings.enforceRosters || !currentMatch) return;

        for (const current of room.getPlayerList()) {
            if (current.team !== 0 && !isRosterAllowed(current)) {
                denyRosterPlayer(current);
            }
        }

        updatePlayerList();
    }

    room.onPlayerJoin = function(player) {
        if (player.auth) {
            authByPlayerId.set(player.id, player.auth);
        }

        // Nombres duplicados: !sub / !captain no podrían distinguirlos y se mezclarían las stats.
        const duplicated = room
            .getPlayerList()
            .some(other =>
                other.id !== player.id &&
                normalizeName(other.name) === normalizeName(player.name)
            );

        if (duplicated) {
            room.kickPlayer(
                player.id,
                "Ya hay un jugador con ese nombre en la sala. Cambiá tu nombre y volvé a entrar.",
                false
            );

            return;
        }

        // Jugadores con cuenta: se los reconoce por su auth. Los nombres de quienes ya vincularon
        // un navegador están reservados, y quien no es reconocido no puede usarlos.
        const decision = checkJoin({
            name: player.name,
            auth: player.auth,
            directory: identityDirectory,
            bracketPlayers
        });

        if (decision.action === "kick") {
            room.kickPlayer(player.id, decision.message, false);

            return;
        }

        if (decision.profile) {
            attachProfile(player);

            console.log(`"${player.name}" reconocido como jugador "${decision.profile.name}".`);

            room.sendAnnouncement(
                `✅ Te reconocí: sos ${decision.profile.name}.`,
                player.id,
                0x00FF00
            );
        } else if (findBracketPlayer(player)) {
            // Sin cuenta: un nombre inscripto en Bracket queda vinculado al auth de quien lo usó primero.
            const identity = authStore.checkAndBind(player.name, player.auth);

            if (identity === "mismatch") {
                room.kickPlayer(
                    player.id,
                    "Ese nombre pertenece a otro jugador inscripto. Si sos vos y cambiaste de " +
                    "computadora o navegador, pedile a un admin que use !desvincular.",
                    false
                );

                return;
            }

            if (identity === "bound") {
                console.log(`Nombre "${player.name}" vinculado a su identidad de Haxball.`);
            }
        }

        grantAdminIfListed(player);
        updateAdmins();
        updatePlayerList();
    };

    room.onPlayerLeave = function(player) {
        adminFailures.delete(player.id);
        linkFailures.delete(player.id);
        authByPlayerId.delete(player.id);
        roomProfiles.delete(player.id);

        updateAdmins();
        updatePlayerList();
    };

    room.onPlayerTeamChange = function(changedPlayer, byPlayer) {
        updatePlayerList();

        if (!swappingTeams && changedPlayer.team !== 0 && !isRosterAllowed(changedPlayer)) {
            denyRosterPlayer(changedPlayer);
            return;
        }

        if(changedPlayer.team === 0 && !swappingTeams) {
            resetPlayerStats(changedPlayer);
        } 

        if(!swappingTeams){
            for (const player of playingPlayerList) {
                generateStats(player);
            }
        }
    };

    room.onGameTick = function() {
        const scores = room.getScores();

        if (!scores) return;

        if (currentHalf !== 1 && currentHalf !== 2 && currentHalf !== 3) return;

        if (currentHalf === 3) {
            // Gol de oro: si nadie convierte, se repite el período.
            if (!overtimeEnding && scores.time >= overtimeSeconds) {
                startOvertime({ restart: true });

                return;
            }
        } else if (scores.time >= halfTime) {
            if (currentHalf === 1) {
                score[0] = scores.red;
                score[1] = scores.blue;

                startHalftime();
            } else if (needsTiebreak()) {
                startOvertime();
            } else {
                finishMatch();
            }

            return;
        }

        if (!halfRunning) return;

        const ball = room.getBallPosition();

        if (!ball) return;

        const players = room
            .getPlayerList()
            .filter(player => player.team !== 0);

        for (const player of players) {
            if (!player.position) continue;

            const dx = player.position.x - ball.x;
            const dy = player.position.y - ball.y;

            const distance = Math.hypot(dx, dy);

            if (distance < 26 && lastTouch !== player.id) {
                secondToLastTouch = lastTouch;
                lastTouch = player.id;
            }
        }
    };

    room.onTeamGoal = function(teamNumber) {
        // Gol de oro ya convertido: se ignora lo que pase hasta cerrar el partido.
        if (overtimeEnding) return;

        const scorer = checkPlayerGoal(teamNumber);
        const ownGoalPlayer = scorer
            ? null
            : checkOwnGoal(teamNumber);
        const assister = scorer
            ? room.getPlayer(secondToLastTouch)
            : null;

        if (scorer) {
            emitEvent("goal", {
                teamNumber,
                scorer,
                assister: assister && assister.id !== scorer.id && assister.team === scorer.team
                    ? assister
                    : null
            });
        } else if (ownGoalPlayer) {
            emitEvent("ownGoal", {
                teamNumber,
                player: ownGoalPlayer
            });
        } else {
            emitEvent("goalUnknownScorer", {
                teamNumber
            });
        }

        resetLastTouch();

        if (currentHalf === 3) {
            // Muerte súbita: el primer gol define el partido (con un respiro para festejar).
            overtimeEnding = true;
            halfRunning = false;

            clearTimeout(overtimeTimer);

            overtimeTimer = setTimeout(() => {
                overtimeTimer = null;
                overtimeEnding = false;

                finishMatch();
            }, 2000);
        }
    };


    // ============================================================
    // COMMANDS
    // ============================================================

    // Haxball necesita el booleano en el acto ("false" oculta el mensaje del chat). Una función
    // async devuelve una Promesa, que siempre cuenta como "true" y dejaría a la vista el código de
    // !vincular y la clave de !admin. Por eso esta función es síncrona y el trabajo que espera a la
    // API (handleCommand) corre aparte.
    room.onPlayerChat = function(player, message) {
        if (!message.startsWith(prefijo)) {
            const mutedExpiry = mutedUntil.get(playerKey(player));

            if (mutedExpiry !== undefined) {
                if (Date.now() < mutedExpiry) {
                    sendError(
                        player,
                        `Estás silenciado por ${Math.ceil((mutedExpiry - Date.now()) / 60000)} min más.`
                    );

                    return false;
                }

                mutedUntil.delete(playerKey(player));
            }

            return true;
        }

        handleCommand(player, message).catch(error => {
            console.error(`Error en el comando de "${player.name}":`, error);
        });

        // Los comandos nunca se muestran en el chat.
        return false;
    };

    async function handleCommand(player, message) {
        const args = message
            .slice(prefijo.length)
            .trim()
            .split(/\s+/);

        const command = (args.shift() ?? "").toLowerCase();

        switch (command) {

            // ====================================================
            // GENERAL
            // ====================================================

            case "hola": {
                if (!requireArgCount(player, args, 0, "!hola")) {
                    return false;
                }

                room.sendAnnouncement(
                    `¡Hola, ${player.name}! Bienvenido a la sala.`,
                    null,
                    0x00FF00,
                    "bold"
                );

                return false;
            }

            case "score": {
                if (!requireArgCount(player, args, 0, "!score")) {
                    return false;
                }

                showScore(player);
                return false;
            }

            case "teams": {
                if (!requireArgCount(player, args, 0, "!teams")) {
                    return false;
                }

                showTeams(player);
                return false;
            }

            case "lineup": {
                if (!requireArgCount(player, args, 0, "!lineup")) {
                    return false;
                }

                showLineup(player);
                return false;
            }

            case "time": {
                if (!requireArgCount(player, args, 0, "!time")) {
                    return false;
                }

                showTime(player);
                return false;
            }

            case "stats": {
                if (!requireArgCount(player, args, 0, "!stats")) {
                    return false;
                }

                showStats(player);
                return false;
            }

            case "mvp": {
                if (!requireArgCount(player, args, 0, "!mvp")) {
                    return false;
                }

                showMvp(player);
                return false;
            }

            case "players": {
                if (!requireArgCount(player, args, 0, "!players")) {
                    return false;
                }

                showPlayers(player);
                return false;
            }

            // Se vincula el navegador a la cuenta de la web. Devuelve false SIEMPRE: así el código
            // no se ve en el chat (y además vence rápido y se gasta al usarse).
            case "vincular": {
                const linkAuth = authByPlayerId.get(player.id) ?? player.auth;

                if (!linkAuth) {
                    sendError(
                        player,
                        "Haxball no te entregó una identidad (auth), así que no se puede vincular este navegador."
                    );

                    return false;
                }

                if ((linkFailures.get(player.id) ?? 0) >= 5) {
                    room.kickPlayer(player.id, "Demasiados intentos de vinculación fallidos.", false);

                    return false;
                }

                if (args.length < 1) {
                    sendError(
                        player,
                        "Uso: !vincular CODIGO  (generá el código en la web, en Mi jugador > Vincular Haxball)"
                    );

                    return false;
                }

                try {
                    const result = await vincularHaxball(args.join(""), linkAuth);

                    linkFailures.delete(player.id);

                    await refreshBracketData();

                    room.sendAnnouncement(
                        `✅ Listo: este navegador quedó vinculado al jugador "${result?.name}". ` +
                        "Desde ahora te reconozco en cualquier sala, sin clave.",
                        player.id,
                        0x00FF00,
                        "bold"
                    );

                    const row = findBracketPlayer(player);

                    room.sendAnnouncement(
                        row
                            ? `🏆 En este torneo figurás inscripto como "${row.name}".`
                            : "ℹ️ Todavía no figurás inscripto en este torneo: pedile al organizador que te vincule.",
                        player.id,
                        0xFFFFFF
                    );
                } catch (error) {
                    linkFailures.set(player.id, (linkFailures.get(player.id) ?? 0) + 1);

                    sendError(player, getApiErrorMessage(error, "No se pudo vincular. Probá de nuevo."));
                }

                return false;
            }

            case "yo": {
                const profile = roomProfiles.get(player.id) ?? null;

                if (!profile) {
                    sendError(
                        player,
                        "No estás vinculado a ninguna cuenta. Generá un código en la web y escribí !vincular CODIGO."
                    );

                    return false;
                }

                const row = findBracketPlayer(player);

                room.sendAnnouncement(
                    `👤 Sos el jugador "${profile.name}". ` +
                    (row ? `Inscripto en este torneo como "${row.name}".` : "No figurás inscripto en este torneo."),
                    player.id,
                    0xFFFFFF
                );

                return false;
            }

            case "help": {
                if (!requireArgCount(player, args, 0, "!help")) {
                    return false;
                }

                showHelp(player);
                return false;
            }

            // ====================================================
            // ADMIN
            // ====================================================

            case "iniciar": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!iniciar")) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(player, "Ya hay un partido en curso.");
                    return false;
                }

                if (teams.length !== 2) {
                    sendError(
                        player,
                        "Primero definí los equipos con !camisetas."
                    );

                    return false;
                }

                enforceRosters();

                startFirstHalf();
                return false;
            }

            case "stop": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!stop")) {
                    return false;
                }

                stopMatch();
                return false;
            }

            case "pause": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!pause")) {
                    return false;
                }

                if (currentHalf === 0) {
                    sendError(player, "No hay un partido en curso.");
                    return false;
                }

                if (!halfRunning) {
                    sendError(player, "El partido ya está pausado.");
                    return false;
                }

                pauseMatch();
                return false;
            }

            case "resume": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!resume")) {
                    return false;
                }

                if (currentHalf === 0) {
                    sendError(player, "No hay un partido en curso.");
                    return false;
                }

                if (halfRunning) {
                    sendError(player, "El partido ya está en curso.");
                    return false;
                }

                resumeMatch();
                return false;
            }

            case "partido": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!partido <numero de partido>"
                )) {
                    return false;
                }

                if (currentHalf !== 0 || halftimeTimer || finishingMatch) {
                    sendError(
                        player,
                        "No podés cargar otro partido mientras hay uno en curso."
                    );

                    return false;
                }

                const partidoId = args[0];
                const match = await getMatch(partidoId);

                if (!match) {
                    room.sendAnnouncement(
                        `❌ No se encontró el partido #${partidoId}.`,
                        player.id,
                        0xFF0000,
                        "bold"
                    );

                    return false;
                }
                
                if (match.played) {
                    sendError(
                        player,
                        `El partido #${partidoId} ya fue jugado. Usá !resetPartido ${partidoId}.`
                    );

                    return false;
                }

                // Datos al día: inscripciones y planteles pueden haber cambiado desde el último refresco.
                try {
                    await refreshBracketData();
                } catch (error) {
                    console.error("No se pudo refrescar Bracket:", error.message);
                }

                if (!setTeams(match.team_1_name, match.team_2_name)) {
                    room.sendAnnouncement(
                        `❌ No se pudieron configurar los equipos del partido #${match.id}.`,
                        player.id,
                        0xFF0000,
                        "bold"
                    );

                    return false;
                }

                currentMatch = match;

                room.sendAnnouncement(
                    `👕 ${getCountry(match.team_1_name).bandera} ${match.team_1_name.toUpperCase()} vs ${match.team_2_name.toUpperCase()} ${getCountry(match.team_2_name).bandera}`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                if (String(match.stage_type ?? "").toUpperCase() === "SINGLE_ELIMINATION") {
                    room.sendAnnouncement(
                        "⚔️ Eliminación directa: si hay empate se define por muerte súbita.",
                        null,
                        0xFFD700
                    );
                }

                // Quien ya estaba en la cancha tiene que estar inscripto en el equipo que le toca.
                enforceRosters();

                return false;
            }

            case "camisetas": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    2,
                    "!camisetas <pais 1> <pais 2>"
                )) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(
                        player,
                        "No podés cambiar las camisetas durante un partido."
                    );

                    return false;
                }

                const team1 = args[0].toLowerCase();
                const team2 = args[1].toLowerCase();

                if (!getCountry(team1)) {
                    sendError(player, `No existe el país "${team1}".`);
                    return false;
                }

                if (!getCountry(team2)) {
                    sendError(player, `No existe el país "${team2}".`);
                    return false;
                }

                if (team1 === team2) {
                    sendError(
                        player,
                        "Los dos países deben ser diferentes."
                    );

                    return false;
                }

                setTeams(team1, team2);
                lastMatchMvp = null;

                room.sendAnnouncement(
                    `👕 ${getCountry(team1).bandera} ${team1.toUpperCase()} vs ${team2.toUpperCase()} ${getCountry(team2).bandera}`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "tiempo": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!tiempo <segundos|Ns|Nm>"
                )) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(
                        player,
                        "El tiempo solo puede modificarse antes del partido."
                    );

                    return false;
                }

                const newTime = parseTime(args[0]);

                if (
                    newTime === null ||
                    newTime < 10 ||
                    newTime > 1800
                ) {
                    sendError(
                        player,
                        "El tiempo debe estar entre 10 segundos y 30 minutos."
                    );

                    return false;
                }

                halfTime = newTime;

                room.sendAnnouncement(
                    `⏱️ Cada tiempo durará ${formatTime(halfTime)}.`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "estadio": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!estadio <nombre>"
                )) {
                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(
                        player,
                        "No podés cambiar el estadio durante un partido."
                    );

                    return false;
                }

                const stadiumName = args[0].toLowerCase();

                if (!setStadium(stadiumName)) {
                    sendError(
                        player,
                        `No existe el estadio "${stadiumName}".`
                    );

                    return false;
                }

                room.sendAnnouncement(
                    `🏟️ Estadio cambiado a ${stadiumName.toUpperCase()}.`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "captain": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!captain <jugador>"
                )) {
                    return false;
                }

                const captain = getPlayerFromName(args.join(" "));

                if (captain === undefined) {
                    sendError(
                        player,
                        `No existe un jugador llamado "${args.join(" ")}".`
                    );

                    return false;
                }

                if (captain === null) {
                    sendError(
                        player,
                        "Hay más de un jugador con ese nombre."
                    );

                    return false;
                }

                if (captain.team === 0) {
                    sendError(
                        player,
                        "El capitán debe estar en un equipo."
                    );

                    return false;
                }

                setCaptain(captain);
                return false;
            }

            case "sub": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    2,
                    "!sub <entra> <sale>"
                )) {
                    return false;
                }

                const enteringPlayer = getPlayerFromName(args[0]);
                const leavingPlayer = getPlayerFromName(args[1]);

                if (enteringPlayer === undefined) {
                    sendError(
                        player,
                        `No existe "${args[0]}".`
                    );

                    return false;
                }

                if (leavingPlayer === undefined) {
                    sendError(
                        player,
                        `No existe "${args[1]}".`
                    );

                    return false;
                }

                if (enteringPlayer === null || leavingPlayer === null) {
                    sendError(
                        player,
                        "Hay nombres duplicados. Usá nombres únicos."
                    );

                    return false;
                }

                if (enteringPlayer.team !== 0) {
                    sendError(
                        player,
                        `${enteringPlayer.name} debe ser espectador para entrar como sustituto.`
                    );

                    return false;
                }

                if (leavingPlayer.team === 0) {
                    sendError(
                        player,
                        `${leavingPlayer.name} debe estar jugando para salir.`
                    );

                    return false;
                }

                substitutePlayers(
                    enteringPlayer,
                    leavingPlayer
                );

                return false;
            }

            case "resetpartido": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(
                    player,
                    args,
                    1,
                    "!resetPartido <numero de partido>"
                )) {
                    return false;
                }

                const partidoId = Number(args[0]);

                if (!Number.isInteger(partidoId) || partidoId <= 0) {
                    sendError(
                        player,
                        "El número de partido debe ser un entero positivo."
                    );

                    return false;
                }

                if (currentHalf !== 0) {
                    sendError(
                        player,
                        "No podés resetear un partido mientras hay uno en curso."
                    );

                    return false;
                }

                try {
                    // Si el resultado nunca llegó a Bracket (quedó en la cola), alcanza con descartarlo.
                    if (resultQueue.list().some(item => item.matchId === partidoId)) {
                        resultQueue.remove(partidoId);

                        room.sendAnnouncement(
                            `♻️ Se descartó el resultado pendiente del partido #${partidoId}.`,
                            null,
                            0xFFFFFF,
                            "bold"
                        );

                        return false;
                    }

                    await resetearPartido(
                        tournamentId,
                        partidoId
                    );

                    if (currentMatch?.id === partidoId) {
                        currentMatch = null;
                    }

                    room.sendAnnouncement(
                        `♻️ Partido #${partidoId} reseteado correctamente.`,
                        null,
                        0xFFFFFF,
                        "bold"
                    );

                } catch (error) {
                    console.error(
                        `Error reseteando partido #${partidoId}:`,
                        error
                    );

                    sendError(
                        player,
                        `No se pudo resetear el partido #${partidoId}.`
                    );
                }

                return false;
            }

            // ====================================================
            // ADMINISTRACIÓN Y MODERACIÓN
            // ====================================================

            case "admin": {
                // El mensaje nunca se muestra en el chat (return false) para no filtrar la clave.
                if (!settings.adminPassword) {
                    sendError(player, "No hay una clave de administrador configurada.");
                    return false;
                }

                if (args.length !== 1 || args[0] !== settings.adminPassword) {
                    const failures = (adminFailures.get(player.id) ?? 0) + 1;

                    adminFailures.set(player.id, failures);

                    if (failures >= 5) {
                        room.kickPlayer(player.id, "Demasiados intentos de !admin.", false);
                        return false;
                    }

                    sendError(player, "Clave incorrecta.");
                    return false;
                }

                adminFailures.delete(player.id);

                room.setPlayerAdmin(player.id, true);

                room.sendAnnouncement(
                    "🔧 Ahora sos administrador.",
                    player.id,
                    0x00FF00,
                    "bold"
                );

                return false;
            }

            case "kick":
            case "ban": {
                if (!requireAdmin(player)) return false;

                if (args.length < 1) {
                    sendError(player, `Uso: !${command} <jugador|#id> [motivo]`);
                    return false;
                }

                const isBan = command === "ban";
                const { name, rest } = splitNameArg(args);
                const target = resolvePlayer(player, name);

                if (!target) return false;

                if (target.id === player.id) {
                    sendError(player, "No podés expulsarte a vos mismo.");
                    return false;
                }

                if (target.admin) {
                    sendError(player, "No podés expulsar a otro administrador.");
                    return false;
                }

                room.kickPlayer(
                    target.id,
                    rest || (isBan ? "Baneado por un administrador." : "Expulsado por un administrador."),
                    isBan
                );

                room.sendAnnouncement(
                    `${isBan ? "⛔ BAN" : "👢 KICK"}: ${target.name}${rest ? ` — ${rest}` : ""}`,
                    null,
                    0xFF6600,
                    "bold"
                );

                return false;
            }

            case "clearbans": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!clearbans")) {
                    return false;
                }

                room.clearBans();

                room.sendAnnouncement(
                    "♻️ Se levantaron todos los bans.",
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "mute": {
                if (!requireAdmin(player)) return false;

                if (args.length < 1) {
                    sendError(player, "Uso: !mute <jugador|#id> [minutos]");
                    return false;
                }

                const { name, rest } = splitNameArg(args);
                const target = resolvePlayer(player, name);

                if (!target) return false;

                const minutes = rest ? Number(rest) : 5;

                if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 120) {
                    sendError(player, "Los minutos deben estar entre 1 y 120.");
                    return false;
                }

                mutedUntil.set(playerKey(target), Date.now() + minutes * 60000);

                room.sendAnnouncement(
                    `🔇 ${target.name} fue silenciado por ${minutes} min.`,
                    null,
                    0xFF6600,
                    "bold"
                );

                return false;
            }

            case "unmute": {
                if (!requireAdmin(player)) return false;

                if (args.length < 1) {
                    sendError(player, "Uso: !unmute <jugador|#id>");
                    return false;
                }

                const target = resolvePlayer(player, splitNameArg(args).name);

                if (!target) return false;

                mutedUntil.delete(playerKey(target));

                room.sendAnnouncement(
                    `🔊 ${target.name} ya puede escribir de nuevo.`,
                    null,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "desvincular": {
                if (!requireAdmin(player)) return false;

                if (args.length < 1) {
                    sendError(player, "Uso: !desvincular <nombre del jugador inscripto>");
                    return false;
                }

                const { name } = splitNameArg(args);

                if (identityDirectory.reservedBy(name) !== null) {
                    sendError(
                        player,
                        `"${name}" es un jugador con cuenta: él mismo gestiona sus navegadores desde la web.`
                    );

                    return false;
                }

                if (!authStore.unbind(name)) {
                    sendError(player, `"${name}" no tiene una identidad vinculada.`);
                    return false;
                }

                room.sendAnnouncement(
                    `🔓 "${name}" quedó libre: el próximo que entre con ese nombre se vincula.`,
                    player.id,
                    0xFFFFFF,
                    "bold"
                );

                return false;
            }

            case "actualizar": {
                if (!requireAdmin(player)) return false;

                if (!requireArgCount(player, args, 0, "!actualizar")) {
                    return false;
                }

                try {
                    await refreshBracketData();

                    room.sendAnnouncement(
                        `🔄 Bracket actualizado: ${bracketPlayers.length} jugadores y ${bracketTeams.length} equipos.`,
                        player.id,
                        0xFFFFFF,
                        "bold"
                    );
                } catch (error) {
                    console.error("Error actualizando Bracket:", error);

                    sendError(player, "No se pudo actualizar desde Bracket.");
                }

                return false;
            }

            case "pendientes": {
                if (!requireAdmin(player)) return false;

                const pending = resultQueue.list();

                if (pending.length === 0) {
                    room.sendAnnouncement(
                        "✅ No hay resultados pendientes de enviar a Bracket.",
                        player.id,
                        0xFFFFFF
                    );

                    return false;
                }

                for (const item of pending) {
                    room.sendAnnouncement(
                        `⏳ Partido #${item.matchId}: ${item.attempts} intento(s)` +
                        `${item.stuck ? " [TRABADO: usá !reintentar]" : ""}` +
                        `${item.lastError ? ` — ${item.lastError}` : ""}`,
                        player.id,
                        0xFFAA00
                    );
                }

                return false;
            }

            case "reintentar": {
                if (!requireAdmin(player)) return false;

                // Los trabados (demasiados fallos seguidos) vuelven a entrar al reintento automático.
                for (const item of resultQueue.list().filter(entry => entry.stuck)) {
                    resultQueue.update(item.matchId, { stuck: false, attempts: 0 });
                }

                if (resultQueue.size() === 0) {
                    room.sendAnnouncement(
                        "✅ No hay resultados pendientes de enviar a Bracket.",
                        player.id,
                        0xFFFFFF
                    );

                    return false;
                }

                const result = await retryPendingResults();

                if (result && result.failed.length + result.stuck.length > 0) {
                    sendError(
                        player,
                        `Todavía no se pudo enviar: ${[...result.failed, ...result.stuck].map(id => `#${id}`).join(", ")}.`
                    );
                }

                return false;
            }

            default: {
                sendError(
                    player,
                    `Comando desconocido: !${command}. Usá !help.`
                );

                return false;
            }
        }
    }
});