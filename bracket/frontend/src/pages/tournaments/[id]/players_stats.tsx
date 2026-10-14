import { Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import PlayersStatsTable from '@components/tables/players_stats';
import { getTableState, tableStateToPagination } from '@components/tables/table';
import { capitalize, getTournamentIdFromRouter } from '@components/utils/util';
import TournamentLayout from '@pages/tournaments/_tournament_layout';
import { getPlayersPaginated } from '@services/adapter';

export default function PlayersStatsPage() {
  const { tournamentData } = getTournamentIdFromRouter();

  const tableState = getTableState('goals', false);

  const swrPlayersResponse = getPlayersPaginated(
    tournamentData.id,
    tableStateToPagination(tableState),
  );

  const playerCount = swrPlayersResponse.data?.data.count ?? 0;

  const { t } = useTranslation();

  return (
    <TournamentLayout tournament_id={tournamentData.id}>
      <Title>{capitalize(t('player_statistics_title'))}</Title>

      <PlayersStatsTable
        playerCount={playerCount}
        swrPlayersResponse={swrPlayersResponse}
        tableState={tableState}
      />
    </TournamentLayout>
  );
}
