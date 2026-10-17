import useSWR, { SWRResponse } from 'swr';

import { Team } from '@openapi';
import { fetcher } from '@services/adapter';

// Respuestas de los endpoints públicos de estadísticas (backend: bracket/routes/stats.py).

export interface PlayerStatsRow {
  player_id: number;
  name: string;
  team_id: number | null;
  team_name: string | null;
  matches_played: number;
  goals: number;
  assists: number;
  own_goals: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface PlayerMatchEntry {
  match_id: number;
  number: number;
  start_time: string | null;
  team_id: number;
  team_name: string;
  opponent_id: number | null;
  opponent_name: string | null;
  goals_for: number;
  goals_against: number;
  goals: number;
  assists: number;
  own_goals: number;
}

export interface PlayerProfile {
  player: PlayerStatsRow;
  matches: PlayerMatchEntry[];
}

export interface TeamMatchEntry {
  match_id: number;
  number: number;
  played: boolean;
  start_time: string | null;
  court_name: string | null;
  opponent_id: number | null;
  opponent_name: string | null;
  goals_for: number;
  goals_against: number;
}

export interface TeamProfile {
  team: Team;
  players: PlayerStatsRow[];
  goals_for: number;
  goals_against: number;
  matches: TeamMatchEntry[];
}

const REFRESH = { refreshInterval: 15_000 };

export function getPlayersStatsLive(
  tournament_id: number | null,
): SWRResponse<{ data: PlayerStatsRow[] }> {
  return useSWR(
    tournament_id == null ? null : `tournaments/${tournament_id}/stats/players`,
    fetcher,
    REFRESH,
  );
}

export function getPlayerProfileLive(
  tournament_id: number | null,
  player_id: number | null,
): SWRResponse<{ data: PlayerProfile }> {
  return useSWR(
    tournament_id == null || player_id == null
      ? null
      : `tournaments/${tournament_id}/players/${player_id}/profile`,
    fetcher,
    REFRESH,
  );
}

export function getTeamProfileLive(
  tournament_id: number | null,
  team_id: number | null,
): SWRResponse<{ data: TeamProfile }> {
  return useSWR(
    tournament_id == null || team_id == null
      ? null
      : `tournaments/${tournament_id}/teams/${team_id}/profile`,
    fetcher,
    REFRESH,
  );
}

export type MatchResult = 'win' | 'draw' | 'loss';

export function getMatchResult(goalsFor: number, goalsAgainst: number): MatchResult {
  if (goalsFor > goalsAgainst) return 'win';
  if (goalsFor < goalsAgainst) return 'loss';
  return 'draw';
}
