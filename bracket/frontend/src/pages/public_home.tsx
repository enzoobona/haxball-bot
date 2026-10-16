import {
  Alert,
  BackgroundImage,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconBrandDiscord, IconBroadcast, IconCalendar, IconTrophy } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { NoContent } from '@components/no_content/empty_table_info';
import PublicLayout from '@components/public/public_layout';
import { DateTime } from '@components/utils/datetime';
import PreloadLink from '@components/utils/link';
import { setTitle } from '@components/utils/util';
import { Tournament } from '@openapi';
import { getBaseApiUrl, getPublicTournaments } from '@services/adapter';
import { DISCORD_URL, SITE_NAME, SITE_TAGLINE, STREAM_URL } from '../config';
import classes from './public_home.module.css';

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const { t } = useTranslation();
  const finished = tournament.status === 'ARCHIVED';
  const href = `/tournaments/${tournament.dashboard_endpoint}/dashboard`;

  return (
    <Card padding={0} radius="lg" withBorder className={classes.card}>
      <Card.Section component={PreloadLink} href={href} className={classes.cover}>
        {tournament.logo_path ? (
          <Image
            h={170}
            fit="cover"
            alt={t('logo_alt_tournament')}
            src={`${getBaseApiUrl()}/static/tournament-logos/${tournament.logo_path}`}
          />
        ) : (
          <Box className={classes.coverFallback}>
            <IconTrophy size={64} stroke={1.3} />
          </Box>
        )}
      </Card.Section>

      <Stack gap="sm" p="lg" style={{ flex: 1 }}>
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Title order={3} lineClamp={2}>
            {tournament.name}
          </Title>
          <Badge color={finished ? 'gray' : 'brand'} variant={finished ? 'light' : 'filled'}>
            {finished ? t('public_archived_badge') : t('public_open_badge')}
          </Badge>
        </Group>

        <Group gap={6} c="dimmed" wrap="nowrap">
          <IconCalendar size={16} />
          <Text size="sm">
            {t('public_starts_on')} <DateTime datetime={tournament.start_time} />
          </Text>
        </Group>

        <Button component={PreloadLink} href={href} fullWidth mt="auto">
          {t('public_hero_cta_watch')}
        </Button>
      </Stack>
    </Card>
  );
}

function TournamentList() {
  const { t } = useTranslation();
  const swr = getPublicTournaments();

  if (swr.isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        <Skeleton height={320} radius="lg" />
        <Skeleton height={320} radius="lg" visibleFrom="sm" />
        <Skeleton height={320} radius="lg" visibleFrom="lg" />
      </SimpleGrid>
    );
  }
  if (swr.error) {
    return (
      <Alert color="red" radius="lg" title={t('error_title')}>
        {t('internal_server_error')}
      </Alert>
    );
  }

  const tournaments: Tournament[] = swr.data?.data ?? [];
  if (tournaments.length < 1) {
    return (
      <NoContent
        title={t('public_no_tournaments_title')}
        description={t('public_no_tournaments_description')}
        icon={<IconTrophy size={96} stroke={1.2} />}
      />
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </SimpleGrid>
  );
}

export default function PublicHomePage() {
  const { t } = useTranslation();
  useEffect(() => setTitle(SITE_NAME), []);

  return (
    <PublicLayout>
      <section className={classes.hero}>
        <Container size="lg" py={{ base: 40, sm: 72 }}>
          <BackgroundImage src='/banner.jpeg'>
            <Title className={classes.heroTitle}>{SITE_NAME}</Title>
            <Text className={classes.heroText} mt="md" maw={620}>
              {SITE_TAGLINE}
            </Text>
            <Group mt="xl" gap="sm">
              {STREAM_URL ? (
                <Button
                  component="a"
                  href={STREAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  size="md"
                  leftSection={<IconBroadcast size={20} />}
                >
                  {t('public_watch_stream')}
                </Button>
              ) : null}
              {DISCORD_URL ? (
                <Button
                  component="a"
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noreferrer"
                  size="md"
                  variant="white"
                  color="dark"
                  leftSection={<IconBrandDiscord size={20} />}
                >
                  {t('public_join_discord')}
                </Button>
              ) : null}
            </Group>
          </BackgroundImage>
        </Container>
      </section>

      <Container size="lg" py="xl">
        <Title order={2} mb="lg">
          {t('tournaments_public_title')}
        </Title>
        <TournamentList />
      </Container>
    </PublicLayout>
  );
}
