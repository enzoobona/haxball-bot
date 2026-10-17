import { Paper, TextInput } from '@mantine/core';
import { IconChartBar, IconSearch } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardShell, getTournamentHeadTitle } from '@components/dashboard/layout';
import { NoContent } from '@components/no_content/empty_table_info';
import { PlayersTable } from '@components/public/stats_widgets';
import { TableSkeletonTwoColumns } from '@components/utils/skeletons';
import { responseIsValid, setTitle } from '@components/utils/util';
import { getTournamentResponseByEndpointName } from '@services/dashboard';
import { PlayerStatsRow, getPlayersStatsLive } from '@services/stats';

export default function DashboardStatsPage() {
  const { t } = useTranslation();
  const tournamentDataFull = getTournamentResponseByEndpointName();
  const tournamentValid = !React.isValidElement(tournamentDataFull);
  const swrStats = getPlayersStatsLive(tournamentValid ? tournamentDataFull.id : null);
  const [sortKey, setSortKey] = useState<keyof PlayerStatsRow>('goals');
  const [search, setSearch] = useState('');

  if (!tournamentValid) {
    return tournamentDataFull;
  }
  setTitle(`${t('stats_title')} | ${getTournamentHeadTitle(tournamentDataFull)}`);

  const all: PlayerStatsRow[] = responseIsValid(swrStats) ? swrStats.data!.data : [];
  // Solo jugadores con partidos jugados: los que todavía no jugaron no aportan a la tabla.
  const rows = all
    .filter((p) => p.matches_played > 0)
    .filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort(
      (a, b) =>
        (b[sortKey] as number) - (a[sortKey] as number) ||
        b.goals - a.goals ||
        b.assists - a.assists ||
        a.name.localeCompare(b.name),
    );

  let content: React.ReactNode;
  if (!responseIsValid(swrStats)) {
    content = <TableSkeletonTwoColumns />;
  } else if (all.every((p) => p.matches_played < 1)) {
    content = (
      <NoContent
        title={t('stats_no_data_title')}
        description={t('stats_no_data_description')}
        icon={<IconChartBar size={96} stroke={1.2} />}
      />
    );
  } else {
    content = (
      <>
        <TextInput
          mb="md"
          leftSection={<IconSearch size={16} />}
          placeholder={t('stats_player_header')}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Paper withBorder radius="lg" p="xs">
          <PlayersTable rows={rows} sortKey={sortKey} onSort={setSortKey} />
        </Paper>
      </>
    );
  }

  return (
    <DashboardShell tournamentData={tournamentDataFull} size="lg">
      {content}
    </DashboardShell>
  );
}
