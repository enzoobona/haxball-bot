import { Avatar, Badge, Card, Group, SimpleGrid, Text } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardShell, getTournamentHeadTitle } from '@components/dashboard/layout';
import { NoContent } from '@components/no_content/empty_table_info';
import { TableSkeletonTwoColumns } from '@components/utils/skeletons';
import { responseIsValid, setTitle } from '@components/utils/util';
import { FullTeamWithPlayers } from '@openapi';
import { getBaseApiUrl, getTeamsLive } from '@services/adapter';
import { getTournamentResponseByEndpointName } from '@services/dashboard';

function ShirtDots({ team }: { team: FullTeamWithPlayers }) {
  const colors = [team.shirt_color_1, team.shirt_color_2, team.shirt_color_3].filter(
    (c): c is string => !!c,
  );
  if (colors.length < 1) return null;
  return (
    <Group gap={4} wrap="nowrap">
      {colors.map((color, i) => (
        <span
          key={`${color}-${i}`}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: color,
            border: '1px solid var(--mantine-color-dark-3)',
            display: 'inline-block',
          }}
        />
      ))}
    </Group>
  );
}

function TeamCard({ team }: { team: FullTeamWithPlayers }) {
  const { t } = useTranslation();
  const players = [...team.players].map((p) => p.name).sort((a, b) => a.localeCompare(b));

  return (
    <Card withBorder radius="lg" padding="md">
      <Group wrap="nowrap" gap="sm" align="center">
        <Avatar
          size={48}
          radius="xl"
          color="brand"
          src={team.logo_path ? `${getBaseApiUrl()}/static/team-logos/${team.logo_path}` : null}
          alt={team.name}
        >
          {team.emoji || team.name.slice(0, 2).toUpperCase()}
        </Avatar>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text fw={800} size="lg" lineClamp={1} title={team.name}>
            {team.emoji ? `${team.emoji} ` : ''}
            {team.name}
          </Text>
          <Group gap="xs" mt={2}>
            <ShirtDots team={team} />
            <Badge variant="light" size="sm" color="gray">
              {players.length} {t('public_players_count')}
            </Badge>
          </Group>
        </div>
      </Group>

      <Text size="sm" c="dimmed" mt="sm">
        {players.length > 0 ? players.join(', ') : t('public_team_no_players')}
      </Text>
    </Card>
  );
}

export default function DashboardTeamsPage() {
  const { t } = useTranslation();
  const tournamentDataFull = getTournamentResponseByEndpointName();
  const tournamentValid = !React.isValidElement(tournamentDataFull);
  const swrTeamsResponse = getTeamsLive(tournamentValid ? tournamentDataFull.id : null);

  if (!tournamentValid) {
    return tournamentDataFull;
  }
  setTitle(`${t('public_teams_title')} | ${getTournamentHeadTitle(tournamentDataFull)}`);

  const teams: FullTeamWithPlayers[] = responseIsValid(swrTeamsResponse)
    ? swrTeamsResponse.data!.data.teams.filter((team: FullTeamWithPlayers) => team.active)
    : [];

  let content: React.ReactNode;
  if (!responseIsValid(swrTeamsResponse)) {
    content = <TableSkeletonTwoColumns />;
  } else if (teams.length < 1) {
    content = (
      <NoContent
        title={t('no_teams_title')}
        description={t('public_no_teams_description')}
        icon={<IconUsers size={96} stroke={1.2} />}
      />
    );
  } else {
    content = (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {[...teams]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
      </SimpleGrid>
    );
  }

  return (
    <DashboardShell tournamentData={tournamentDataFull} size="lg">
      {content}
    </DashboardShell>
  );
}
