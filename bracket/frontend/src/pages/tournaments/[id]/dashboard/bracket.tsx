import { Group, Stack, Tabs, Text } from '@mantine/core';
import { IconBrackets } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import RoundComponent from '@components/brackets/round';
import { DashboardShell, getTournamentHeadTitle } from '@components/dashboard/layout';
import { NoContent } from '@components/no_content/empty_table_info';
import { TableSkeletonTwoColumns } from '@components/utils/skeletons';
import { responseIsValid, setTitle } from '@components/utils/util';
import { StageItemWithRounds, StageWithStageItems } from '@openapi';
import { getStagesLive } from '@services/adapter';
import { getTournamentResponseByEndpointName } from '@services/dashboard';

const displaySettings: any = {
  matchVisibility: 'all',
  setMatchVisibility: () => {},
  showManualSchedulingOptions: 'false',
  setShowManualSchedulingOptions: () => {},
};

function StageItemRounds({
  stageItem,
  tournamentData,
  swrStagesResponse,
}: {
  stageItem: StageItemWithRounds;
  tournamentData: any;
  swrStagesResponse: any;
}) {
  const { t } = useTranslation();
  const rounds = [...stageItem.rounds]
    .filter((round) => round.matches.length > 0)
    .sort((r1, r2) => r1.name.localeCompare(r2.name, undefined, { numeric: true }));

  if (rounds.length < 1) {
    return <Text c="dimmed">{t('no_round_found_in_stage_description')}</Text>;
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <Group align="flex-start" wrap="nowrap" gap="md">
        {rounds.map((round) => (
          <div key={round.id} style={{ flex: '0 0 min(340px, 85vw)' }}>
            <RoundComponent
              tournamentData={tournamentData}
              round={round}
              swrStagesResponse={swrStagesResponse}
              swrUpcomingMatchesResponse={null}
              readOnly
              displaySettings={displaySettings}
            />
          </div>
        ))}
      </Group>
    </div>
  );
}

export default function DashboardBracketPage() {
  const { t } = useTranslation();
  const tournamentDataFull = getTournamentResponseByEndpointName();
  const tournamentValid = !React.isValidElement(tournamentDataFull);
  const swrStagesResponse = getStagesLive(tournamentValid ? tournamentDataFull.id : null);

  if (!tournamentValid) {
    return tournamentDataFull;
  }
  setTitle(`${t('bracket_title')} | ${getTournamentHeadTitle(tournamentDataFull)}`);

  const stageItems: StageItemWithRounds[] = responseIsValid(swrStagesResponse)
    ? swrStagesResponse
        .data!.data.flatMap((stage: StageWithStageItems) => stage.stage_items)
        .filter((item: StageItemWithRounds) => item.rounds.some((r) => r.matches.length > 0))
    : [];

  let content: React.ReactNode;
  if (!responseIsValid(swrStagesResponse)) {
    content = <TableSkeletonTwoColumns />;
  } else if (stageItems.length < 1) {
    content = (
      <NoContent
        title={t('public_no_bracket_title')}
        description={t('public_no_bracket_description')}
        icon={<IconBrackets size={96} stroke={1.2} />}
      />
    );
  } else if (stageItems.length === 1) {
    content = (
      <StageItemRounds
        stageItem={stageItems[0]}
        tournamentData={tournamentDataFull}
        swrStagesResponse={swrStagesResponse}
      />
    );
  } else {
    content = (
      <Tabs defaultValue={`${stageItems[0].id}`} keepMounted={false}>
        <Tabs.List style={{ flexWrap: 'nowrap', overflowX: 'auto' }} mb="md">
          {stageItems.map((item) => (
            <Tabs.Tab key={item.id} value={`${item.id}`} style={{ flexShrink: 0 }}>
              {item.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {stageItems.map((item) => (
          <Tabs.Panel key={item.id} value={`${item.id}`}>
            <StageItemRounds
              stageItem={item}
              tournamentData={tournamentDataFull}
              swrStagesResponse={swrStagesResponse}
            />
          </Tabs.Panel>
        ))}
      </Tabs>
    );
  }

  return (
    <DashboardShell tournamentData={tournamentDataFull} size="lg">
      <Stack>{content}</Stack>
    </DashboardShell>
  );
}
