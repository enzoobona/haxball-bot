import { Avatar, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconUsersGroup } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { DashboardShell, getTournamentHeadTitle } from '@components/dashboard/layout';
import { NoContent } from '@components/no_content/empty_table_info';
import { MatchLogItem, PlayersTable, StatCard } from '@components/public/stats_widgets';
import { TableSkeletonTwoColumns } from '@components/utils/skeletons';
import { responseIsValid, setTitle } from '@components/utils/util';
import { getBaseApiUrl } from '@services/adapter';
import { getTournamentResponseByEndpointName } from '@services/dashboard';
import { getTeamProfileLive } from '@services/stats';

export default function DashboardTeamPage() {
  const { t } = useTranslation();
  const { id: endpoint, team_id } = useParams();
  const tournamentDataFull = getTournamentResponseByEndpointName();
  const tournamentValid = !React.isValidElement(tournamentDataFull);
  const swrProfile = getTeamProfileLive(
    tournamentValid ? tournamentDataFull.id : null,
    team_id != null && /^\d+$/.test(team_id) ? Number(team_id) : null,
  );

  if (!tournamentValid) {
    return tournamentDataFull;
  }

  const profile = responseIsValid(swrProfile) ? swrProfile.data!.data : null;
  setTitle(`${profile?.team.name ?? t('team_title')} | ${getTournamentHeadTitle(tournamentDataFull)}`);

  let content: React.ReactNode;
  if (swrProfile.error != null) {
    content = (
      <NoContent
        title={t('profile_not_found_title')}
        description={t('profile_not_found_description')}
        icon={<IconUsersGroup size={96} stroke={1.2} />}
      />
    );
  } else if (profile == null) {
    content = <TableSkeletonTwoColumns />;
  } else {
    const { team, players, matches } = profile;
    const played = matches.filter((m) => m.played);
    content = (
      <Stack gap="lg">
        <Link
          to={`/tournaments/${endpoint}/dashboard/teams`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <Group gap={6} c="dimmed">
            <IconArrowLeft size={14} />
            <Text size="sm">{t('public_teams_title')}</Text>
          </Group>
        </Link>

        <Group wrap="nowrap" gap="md">
          <Avatar
            size={64}
            radius="xl"
            color="brand"
            src={team.logo_path ? `${getBaseApiUrl()}/static/team-logos/${team.logo_path}` : null}
            alt={team.name}
          >
            {team.emoji || team.name.slice(0, 2).toUpperCase()}
          </Avatar>
          <Title order={2} style={{ minWidth: 0 }}>
            {team.name}
          </Title>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
          <StatCard label={t('stats_played_short')} value={played.length} />
          <StatCard label={t('stats_wins_short')} value={team.wins ?? 0} />
          <StatCard label={t('stats_draws_short')} value={team.draws ?? 0} />
          <StatCard label={t('stats_losses_short')} value={team.losses ?? 0} />
          <StatCard label={t('profile_goals_for')} value={profile.goals_for} />
          <StatCard label={t('profile_goals_against')} value={profile.goals_against} />
        </SimpleGrid>

        <Title order={3}>{t('profile_roster_title')}</Title>
        {players.length < 1 ? (
          <Text c="dimmed">{t('public_team_no_players')}</Text>
        ) : (
          <Paper withBorder radius="lg" p="xs">
            <PlayersTable rows={players} showTeam={false} />
          </Paper>
        )}

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
                played={m.played}
                detail={m.court_name}
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
