import useSWR, { SWRResponse } from 'swr';

import { createAxios, handleRequestError } from './adapter';

export interface PlayerProfilePublic {
  id: number;
  name: string;
}

export interface HaxballIdentity {
  id: number;
  auth_hint: string;
  created: string;
}

export interface ProfileStats {
  tournaments: number;
  matches_played: number;
  goals: number;
  assists: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface ProfileTournamentStats {
  tournament_id: number;
  tournament_name: string;
  goals: number;
  assists: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface MyHaxball {
  profile: PlayerProfilePublic | null;
  identities: HaxballIdentity[];
  max_identities: number;
  stats: ProfileStats;
  tournaments: ProfileTournamentStats[];
}

export interface LinkCode {
  code: string;
  expires_at: string;
}

/** Mi jugador: perfil, navegadores vinculados y estadísticas acumuladas. */
export function getMyHaxball(): SWRResponse<{ data: MyHaxball }> {
  return useSWR('haxball/me', (url: string) =>
    createAxios()
      .get(url)
      .then((res: { data: any }) => res.data),
  );
}

export async function createMyProfile(name: string) {
  return createAxios()
    .post('haxball/me/profile', { name })
    .catch((response: any) => handleRequestError(response));
}

export async function renameMyProfile(name: string) {
  return createAxios()
    .put('haxball/me/profile', { name })
    .catch((response: any) => handleRequestError(response));
}

export async function createLinkCode(): Promise<LinkCode | null> {
  const response = await createAxios()
    .post('haxball/me/link-code')
    .catch((error: any) => handleRequestError(error));

  return response != null ? (response.data.data as LinkCode) : null;
}

export async function deleteMyIdentity(identity_id: number) {
  return createAxios()
    .delete(`haxball/me/identities/${identity_id}`)
    .catch((response: any) => handleRequestError(response));
}

/** Para que el organizador vincule a mano una fila de jugador con un jugador con cuenta. */
export async function searchProfiles(search: string): Promise<PlayerProfilePublic[]> {
  const response = await createAxios()
    .get('haxball/profiles', { params: { search: search || undefined, limit: 20 } })
    .catch((error: any) => handleRequestError(error));

  return response != null ? (response.data.data as PlayerProfilePublic[]) : [];
}

/** `profile_id: null` desvincula la fila. */
export async function linkPlayerToProfile(
  tournament_id: number,
  player_id: number,
  profile_id: number | null,
) {
  return createAxios()
    .put(`tournaments/${tournament_id}/players/${player_id}/profile`, { profile_id })
    .catch((response: any) => handleRequestError(response));
}
