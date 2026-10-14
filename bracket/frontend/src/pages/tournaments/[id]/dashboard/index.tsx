import { Center, SegmentedControl, Stack, Text } from '@mantine/core';
import { IconCalendarOff } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardShell, getTournamentHeadTitle } from '@components/dashboard/layout';
import { NoContent } from '@components/no_content/empty_table_info';
import MatchCard from '@components/public/match_card';
import { compareDateTime, formatDayLabel } from '@components/utils/datetime';
import { isMatchHappening, isMatchInTheFuture } from '@components/utils/match';
import { TableSkeletonTwoColumns } from '@components/utils/skeletons';
import { Translator } from '@components/utils/types';
import { responseIsValid, setTitle } from '@components/utils/util';
import { getStagesLive } from '@services/adapter';
import { getTournamentResponseByEndpointName } from '@services/dashboard';
import { getMatchLookup, getStageItemLookup } from '@services/lookups';

type Filter = 'all' | 'upcoming' | 'played';

export function Schedule({
  t,
  stageItemsLookup,
  matchesLookup,
}: {
  t: Translator;
  stageItemsLookup: any;
  matchesLookup: any;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const all: any[] = Object.values(matchesLookup);

  const scheduled = all
    .filter((m) => m.match.start_time != null)
    .sort(
      (m1, m2) =>
        compareDateTime(m1.match.start_time, m2.match.start_time) ||
        (m1.match.court?.name ?? '').localeCompare(m2.match.court?.name ?? ''),
    );
  const unscheduled = all.filter((m) => m.match.start_time == null);

  const matchesFilter = (m: any) => {
    if (filter === 'all') return true;
    if (m.match.start_time == null) return filter === 'upcoming';
    const ongoingOrFuture = isMatchHappening(m.match) || isMatchInTheFuture(m.match);
    return filter === 'upcoming' ? ongoingOrFuture : !ongoingOrFuture;
  };

  const visibleScheduled = scheduled.filter(matchesFilter);
  const visibleUnscheduled = unscheduled.filter(matchesFilter);

  if (all.length < 1) {
    return (
      <NoContent
        title={t('public_not_started_title')}
        description={t('public_not_started_description')}
        icon={<IconCalendarOff size={96} stroke={1.2} />}
      />
    );
  }

  // Agrupa por día para que la lista sea fácil de recorrer.
  const groups: { label: string; items: any[] }[] = [];
  visibleScheduled.forEach((m) => {
    const label = formatDayLabel(m.match.start_time);
    const last = groups[groups.length - 1];
    if (last != null && last.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  });
  if (visibleUnscheduled.length > 0) {
    groups.push({ label: t('public_unscheduled'), items: visibleUnscheduled });
  }

  return (
    <Stack gap="lg">
      <SegmentedControl
        fullWidth
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
        data={[
          { value: 'all', label: t('public_filter_all') },
          { value: 'upcoming', label: t('public_filter_upcoming') },
          { value: 'played', label: t('public_filter_played') },
        ]}
      />

      {groups.length < 1 ? (
        <Text ta="center" c="dimmed" py="xl">
          {t('public_no_matches_filtered')}
        </Text>
      ) : (
        groups.map((group) => (
          <Stack gap="sm" key={group.label}>
            <Text fw={800} tt="uppercase" size="sm" c="dimmed" style={{ letterSpacing: '0.05em' }}>
              {group.label}
            </Text>
            {group.items.map((data) => (
              <MatchCard
                key={data.match.id}
                data={data}
                stageItemsLookup={stageItemsLookup}
                matchesLookup={matchesLookup}
              />
            ))}
          </Stack>
        ))
      )}
    </Stack>
  );
}

export default function DashboardSchedulePage() {
  const { t } = useTranslation();
  const tournamentDataFull = getTournamentResponseByEndpointName();
  const tournamentValid = !React.isValidElement(tournamentDataFull);

  const swrStagesResponse = getStagesLive(tournamentValid ? tournamentDataFull.id : null);

  if (!tournamentValid) {
    return tournamentDataFull;
  }

  setTitle(getTournamentHeadTitle(tournamentDataFull));

  const stageItemsLookup = responseIsValid(swrStagesResponse)
    ? getStageItemLookup(swrStagesResponse)
    : [];
  const matchesLookup = responseIsValid(swrStagesResponse) ? getMatchLookup(swrStagesResponse) : [];

  return (
    <DashboardShell tournamentData={tournamentDataFull}>
      {responseIsValid(swrStagesResponse) ? (
        <Schedule t={t} matchesLookup={matchesLookup} stageItemsLookup={stageItemsLookup} />
      ) : swrStagesResponse.error ? (
        <Center>
          <Text c="dimmed">{t('public_loading_error')}</Text>
        </Center>
      ) : (
        <TableSkeletonTwoColumns />
      )}
    </DashboardShell>
  );
}
