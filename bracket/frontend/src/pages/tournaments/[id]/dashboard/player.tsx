import { Avatar, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconUserOff } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { DashboardShell, getTournamentHeadTitle } from '@components/dashboard/layout';
import { NoContent } from '@components/no_content/empty_table_info';
import { TeamLink } from '@components/public/entity_links';
import { MatchLogItem, StatCard } from '@components/public/stats_widgets';
import { TableSkeletonTwoColumns } from '@components/utils/skeletons';
import { responseIsValid, setTitle } from '@components/utils/util';
import { getTournamentResponseByEndpointName } from '@services/dashboard';
import { getPlayerProfileLive } from '@services/stats';

export default function DashboardPlayerPage() {
  const { t } = useTranslation();
  const { id: endpoint, player_id } = useParams();
  const tournamentDataFull = getTournamentResponseByEndpointName();
  const tournamentValid = !React.isValidElement(tournamentDataFull);
  const swrProfile = getPlayerProfileLive(
    tournamentValid ? tournamentDataFull.id : null,
    player_id != null && /^\d+$/.test(player_id) ? Number(player_id) : null,
  );

  if (!tournamentValid) {
    return tournamentDataFull;
  }

  const profile = responseIsValid(swrProfile) ? swrProfile.data!.data : null;
  setTitle(
    `${profile?.player.name ?? t('profile_player_label')} | ${getTournamentHeadTitle(tournamentDataFull)}`,
  );

  let content: React.ReactNode;
  if (swrProfile.error != null) {
    content = (
      <NoContent
        title={t('profile_not_found_title')}
        description={t('profile_not_found_description')}
        icon={<IconUserOff size={96} stroke={1.2} />}
      />
    );
  } else if (profile == null) {
    content = <TableSkeletonTwoColumns />;
  } else {
    const { player, matches } = profile;
    content = (
      <Stack gap="lg">
        <Link
          to={`/tournaments/${endpoint}/dashboard/stats`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <Group gap={6} c="dimmed">
            <IconArrowLeft size={14} />
            <Text size="sm">{t('profile_back_to_stats')}</Text>
          </Group>
        </Link>

        <Group wrap="nowrap" gap="md">
          <Avatar size={64} radius="xl" color="brand">
            {player.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Title order={2}>{player.name}</Title>
            {player.team_name ? (
              <Text c="dimmed">
                <TeamLink teamId={player.team_id}>{player.team_name}</TeamLink>
              </Text>
            ) : null}
          </div>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4, md: 6 }} spacing="sm">
          <StatCard label={t('stats_played_short')} value={player.matches_played} />
          <StatCard label={t('goals_label')} value={player.goals} />
          <StatCard label={t('assists_label')} value={player.assists} />
          <StatCard label={t('stats_wins_short')} value={player.wins} />
          <StatCard label={t('stats_draws_short')} value={player.draws} />
          <StatCard label={t('stats_losses_short')} value={player.losses} />
        </SimpleGrid>

        <Title order={3}>{t('profile_matches_title')}</Title>
        {matches.length < 1 ? (
          <Text c="dimmed">{t('profile_no_matches')}</Text>
        ) : (
          <Stack gap="xs">
            {matches.map((m) => (
              <MatchLogItem
                key={m.match_id}
                number={m.number}
                startTime={m.start_time}
                opponentId={m.opponent_id}
                opponentName={m.opponent_name}
                goalsFor={m.goals_for}
                goalsAgainst={m.goals_against}
                played
                detail={[
                  m.goals > 0 ? `${m.goals} ${t('stats_goals_short')}` : null,
                  m.assists > 0 ? `${m.assists} ${t('stats_assists_short')}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </Stack>
        )}
      </Stack>
    );
  }

  return (
    <DashboardShell tournamentData={tournamentDataFull} size="md">
      {content}
    </DashboardShell>
  );
}
