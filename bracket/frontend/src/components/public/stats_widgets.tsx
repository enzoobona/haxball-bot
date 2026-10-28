import { Badge, Group, Paper, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { Time } from '@components/utils/datetime';
import { MatchResult, PlayerStatsRow, getMatchResult } from '@services/stats';
import { PlayerLink, TeamLink } from './entity_links';
import classes from './stats_widgets.module.css';

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper withBorder radius="lg" className={classes.statCard}>
      <Text className={classes.statValue}>{value}</Text>
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
    </Paper>
  );
}

export function ResultBadge({ result }: { result: MatchResult }) {
  const { t } = useTranslation();
  const label = {
    win: t('result_win_short'),
    draw: t('result_draw_short'),
    loss: t('result_loss_short'),
  }[result];
  const color = { win: 'brand', draw: 'gray', loss: 'dark' }[result];
  return (
    <Badge variant={result === 'win' ? 'filled' : 'light'} color={color} size="lg" w={36} p={0}>
      {label}
    </Badge>
  );
}

// Tabla de jugadores con sus números; se usa en la pestaña Estadísticas y en el plantel de un equipo.
export function PlayersTable({
  rows,
  showTeam = true,
  sortKey,
  onSort,
}: {
  rows: PlayerStatsRow[];
  showTeam?: boolean;
  sortKey?: keyof PlayerStatsRow;
  onSort?: (key: keyof PlayerStatsRow) => void;
}) {
  const { t } = useTranslation();
  const columns: [keyof PlayerStatsRow, string][] = [
    ['matches_played', t('stats_played_short')],
    ['goals', t('stats_goals_short')],
    ['assists', t('stats_assists_short')],
    ['wins', t('stats_wins_short')],
    ['draws', t('stats_draws_short')],
    ['losses', t('stats_losses_short')],
  ];

  return (
    <Table.ScrollContainer minWidth={showTeam ? 560 : 420}>
      <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>#</Table.Th>
            <Table.Th>{t('stats_player_header')}</Table.Th>
            {showTeam ? <Table.Th>{t('stats_team_header')}</Table.Th> : null}
            {columns.map(([key, label]) => (
              <Table.Th
                key={key}
                ta="center"
                className={onSort ? classes.sortable : undefined}
                data-active={sortKey === key || undefined}
                onClick={onSort ? () => onSort(key) : undefined}
                title={onSort ? label : undefined}
              >
                {label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, index) => (
            <Table.Tr key={row.player_id}>
              <Table.Td c="dimmed">{index + 1}</Table.Td>
              <Table.Td fw={700}>
                <PlayerLink playerId={row.player_id}>{row.name}</PlayerLink>
              </Table.Td>
              {showTeam ? (
                <Table.Td>
                  {row.team_name ? (
                    <TeamLink teamId={row.team_id}>{row.team_name}</TeamLink>
                  ) : (
                    '-'
                  )}
                </Table.Td>
              ) : null}
              {columns.map(([key]) => (
                <Table.Td key={key} ta="center" className={classes.number}>
                  {row[key] as number}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

// Una fila de la lista de partidos de un jugador o equipo.
export function MatchLogItem({
  number,
  startTime,
  opponentId,
  opponentName,
  goalsFor,
  goalsAgainst,
  played,
  detail,
}: {
  number: number;
  startTime: string | null;
  opponentId: number | null;
  opponentName: string | null;
  goalsFor: number;
  goalsAgainst: number;
  played: boolean;
  detail?: string | null;
}) {
  const { t } = useTranslation();
  return (
    <Paper withBorder radius="lg" className={classes.matchItem}>
      <Group wrap="nowrap" gap="sm" justify="space-between">
        <Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
          {played ? <ResultBadge result={getMatchResult(goalsFor, goalsAgainst)} /> : null}
          <div style={{ minWidth: 0 }}>
            <Text fw={700} lineClamp={1}>
              <TeamLink teamId={opponentId}>{opponentName ?? '-'}</TeamLink>
            </Text>
            <Text size="xs" c="dimmed">
              {t('match_number_short', { number })}
              {startTime ? (
                <>
                  {' · '}
                  <Time datetime={startTime} />
                </>
              ) : null}
              {detail ? ` · ${detail}` : ''}
            </Text>
          </div>
        </Group>
        <Text className={classes.matchScore} data-played={played || undefined}>
          {played ? `${goalsFor} - ${goalsAgainst}` : '-'}
        </Text>
      </Group>
    </Paper>
  );
}
