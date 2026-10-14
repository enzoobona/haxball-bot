import { Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { StandingsContent } from '@pages/tournaments/[id]/dashboard/standings';
import { getStagesLive } from '@services/adapter';
import { capitalize, getTournamentIdFromRouter } from '@components/utils/util';
import TournamentLayout from '@pages/tournaments/_tournament_layout';

export default function StandingsPage() {
  const { tournamentData } = getTournamentIdFromRouter();
  const { t } = useTranslation();

  const swrStagesResponse = getStagesLive(tournamentData.id);

  return (
    <TournamentLayout tournament_id={tournamentData.id}>
      <Title mb="md">
        {capitalize(t('standings_title'))}
      </Title>

      <StandingsContent
        swrStagesResponse={swrStagesResponse}
        fontSizeInPixels={16}
        maxTeamsToDisplay={100}
      />
    </TournamentLayout>
  );
}