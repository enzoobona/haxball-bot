import { Badge, Group, Paper, Text } from '@mantine/core';
import { AiOutlineHourglass } from '@react-icons/all-files/ai/AiOutlineHourglass';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SWRResponse } from 'swr';

import { DashboardShell, getTournamentHeadTitle } from '@components/dashboard/layout';
import { NoContent } from '@components/no_content/empty_table_info';
import { StandingsTableForStageItem } from '@components/tables/standings';
import { TableSkeletonTwoColumns } from '@components/utils/skeletons';
import { responseIsValid, setTitle } from '@components/utils/util';
import { StageItemWithRounds, StagesWithStageItemsResponse } from '@openapi';
import { getStagesLive } from '@services/adapter';
import { getTournamentResponseByEndpointName } from '@services/dashboard';
import { getStageItemLookup, getStageItemTeamsLookup } from '@services/lookups';

function getStageTypeLabel(t: (key: string) => string, stageItem: StageItemWithRounds) {
  switch (stageItem.type) {
    case 'ROUND_ROBIN':
      return t('round_robin_badge');

    case 'SINGLE_ELIMINATION':
      return t('single_elimination_badge');

    case 'SWISS':
      return t('swiss_badge');

    default:
      return stageItem.type;
  }
}

function StageHeader({ stageItem }: { stageItem: StageItemWithRounds }) {
  const { t } = useTranslation();
  return (
    <Group justify="space-between" align="center" mb="sm" wrap="nowrap">
      <Text size="xl" fw={700} inherit>
        {stageItem.name}
      </Text>

      <Badge variant="light" size="lg" radius="md" style={{ flexShrink: 0 }}>
        {getStageTypeLabel(t, stageItem)}
      </Badge>
    </Group>
  );
}

export function StandingsContent({
  swrStagesResponse,
  fontSizeInPixels,
  maxTeamsToDisplay,
}: {
  swrStagesResponse: SWRResponse<StagesWithStageItemsResponse>;
  fontSizeInPixels: number;
  maxTeamsToDisplay: number;
}) {
  const { t } = useTranslation();

  const stageItemsLookup = getStageItemLookup(swrStagesResponse);

  const stageItemTeamLookup = responseIsValid(swrStagesResponse)
    ? getStageItemTeamsLookup(swrStagesResponse)
    : {};

  const rows = Object.keys(stageItemTeamLookup)
    .filter((stageItemId) => stageItemsLookup[stageItemId] != null)
    .sort((si1: any, si2: any) =>
      stageItemsLookup[si1].name.localeCompare(stageItemsLookup[si2].name),
    )
    .map((stageItemId) => {
      const stageItem = stageItemsLookup[stageItemId];

      return (
        <Paper key={stageItemId} withBorder radius="lg" p={{ base: 'xs', sm: 'md' }} mb="lg">
          <StageHeader stageItem={stageItem} />

          <StandingsTableForStageItem
            teams_with_inputs={stageItemTeamLookup[stageItemId]}
            stageItem={stageItem}
            stageItemsLookup={stageItemsLookup}
            fontSizeInPixels={fontSizeInPixels}
            maxTeamsToDisplay={maxTeamsToDisplay}
          />
        </Paper>
      );
    });

  if (rows.length < 1) {
    return (
      <NoContent
        title={`${t('could_not_find_any_alert')} ${t('teams_title')}`}
        description=""
        icon={<AiOutlineHourglass />}
      />
    );
  }

  return rows;
}

export default function DashboardStandingsPage() {
  const tournamentDataFull = getTournamentResponseByEndpointName();
  const tournamentValid = !React.isValidElement(tournamentDataFull);

  const swrStagesResponse = getStagesLive(tournamentValid ? tournamentDataFull.id : null);

  if (!tournamentValid) {
    return tournamentDataFull;
  }

  setTitle(getTournamentHeadTitle(tournamentDataFull));

  return (
    <DashboardShell tournamentData={tournamentDataFull} size="lg">
      {swrStagesResponse.isLoading ? (
        <TableSkeletonTwoColumns />
      ) : (
        <StandingsContent
          swrStagesResponse={swrStagesResponse}
          fontSizeInPixels={16}
          maxTeamsToDisplay={100}
        />
      )}
    </DashboardShell>
  );
}
