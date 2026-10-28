import { Divider, Table, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { MatchPlayerStatsRow, getMatchPlayerStats } from '@services/adapter';

function groupByTeam(rows: MatchPlayerStatsRow[]) {
  const groups = new Map<number, { teamName: string; rows: MatchPlayerStatsRow[] }>();
  rows.forEach((row) => {
    const group = groups.get(row.team_id) ?? { teamName: row.team_name, rows: [] };
    group.rows.push(row);
    groups.set(row.team_id, group);
  });
  return [...groups.values()];
}

/** Goles y asistencias de cada jugador en un partido ya jugado. */
export default function MatchPlayerStatsTable({
  tournamentId,
  matchId,
}: {
  tournamentId: number;
  matchId: number;
}) {
  const { t } = useTranslation();
  const swrStats = getMatchPlayerStats(tournamentId, matchId);

  if (swrStats.isLoading || swrStats.error) return null;

  const rows = swrStats.data?.data ?? [];

  return (
    <>
      <Title order={5} mb="xs">
        {t('match_player_stats_title')}
      </Title>
      {rows.length < 1 ? (
        <Text size="sm" c="dimmed">
          {t('match_player_stats_empty')}
        </Text>
      ) : (
        groupByTeam(rows).map((group) => (
          <Table key={group.teamName} mb="sm" withRowBorders={false} verticalSpacing={4}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{group.teamName}</Table.Th>
                <Table.Th ta="center">{t('goals_label')}</Table.Th>
                <Table.Th ta="center">{t('assists_label')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {group.rows.map((row) => (
                <Table.Tr key={row.player_id}>
                  <Table.Td>{row.player_name}</Table.Td>
                  <Table.Td ta="center">{row.goals}</Table.Td>
                  <Table.Td ta="center">{row.assists}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ))
      )}
      <Divider mt="md" mb="md" />
    </>
  );
}
