import {
  Anchor,
  Badge,
  Center,
  Container,
  Group,
  Image,
  Skeleton,
  Text,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBrackets,
  IconCalendar,
  IconChartBar,
  IconListNumbers,
  IconUsers,
} from '@tabler/icons-react';
import i18n from 'i18next';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { useLocation } from 'react-router';

import PublicLayout from '@components/public/public_layout';
import PreloadLink from '@components/utils/link';
import { getBaseURL } from '@components/utils/util';
import { Tournament } from '@openapi';
import { getBaseApiUrl } from '@services/adapter';
import { SITE_NAME } from '../../config';
import classes from './layout.module.css';

export function TournamentQRCode({ tournamentDataFull }: { tournamentDataFull: Tournament }) {
  if (tournamentDataFull == null) {
    return null;
  }
  return (
    <div
      style={{
        width: '100%',
        background: 'white',
        marginTop: '2rem',
        maxWidth: '400px',
        height: 'auto',
        borderRadius: '16px',
        alignSelf: 'end',
      }}
    >
      <Center>
        <QRCode
          style={{ margin: '24px' }}
          // @ts-ignore
          size="auto"
          value={`${getBaseURL()}/tournaments/${tournamentDataFull.dashboard_endpoint}/dashboard`}
        />
      </Center>
    </div>
  );
}

export function TournamentLogo({ tournamentDataFull }: { tournamentDataFull: Tournament }) {
  if (tournamentDataFull == null) {
    return <Skeleton height={150} radius="xl" mb="xl" />;
  }
  return tournamentDataFull.logo_path ? (
    <>
      <Image
        radius="lg"
        mt="1rem"
        alt={i18n.t('logo_alt_tournament')}
        src={`${getBaseApiUrl()}/static/tournament-logos/${tournamentDataFull.logo_path}`}
        style={{ maxWidth: '400px' }}
      />
    </>
  ) : null;
}

export function getTournamentHeadTitle(tournamentDataFull: Tournament) {
  return tournamentDataFull !== null ? `${tournamentDataFull.name} | ${SITE_NAME}` : SITE_NAME;
}

export function TournamentTitle({ tournamentDataFull }: { tournamentDataFull: Tournament }) {
  return tournamentDataFull != null ? (
    <Title>{tournamentDataFull.name}</Title>
  ) : (
    <Skeleton height={50} radius="lg" mb="xl" />
  );
}

// Las páginas de jugador/equipo (`.../stats/players/1`, `.../teams/3`) mantienen activa su pestaña.
function isTabActive(link: string, pathName: string, base: string) {
  return link === pathName || (link !== base && pathName.startsWith(`${link}/`));
}

export function DoubleHeader({ tournamentData }: { tournamentData: Tournament }) {
  const { t } = useTranslation();
  const location = useLocation();
  const endpoint = tournamentData.dashboard_endpoint || '';
  const base = `/tournaments/${endpoint}/dashboard`;
  const pathName = location.pathname.replace('[id]', endpoint).replace(/\/+$/, '');
  const finished = tournamentData.status === 'ARCHIVED';

  const tabs = [
    { link: base, label: t('matches_title'), icon: IconCalendar },
    { link: `${base}/bracket`, label: t('bracket_title'), icon: IconBrackets },
    { link: `${base}/standings`, label: t('standings_title'), icon: IconListNumbers },
    { link: `${base}/stats`, label: t('stats_title'), icon: IconChartBar },
    { link: `${base}/teams`, label: t('public_teams_title'), icon: IconUsers },
  ];

  return (
    <header className={classes.header}>
      <Container size="lg" pt="md">
        <Anchor component={PreloadLink} href="/" size="sm" c="dimmed" className={classes.back}>
          <IconArrowLeft size={14} />
          {t('public_back_to_tournaments')}
        </Anchor>

        <Group wrap="nowrap" gap="md" mt="sm" align="center">
          {tournamentData.logo_path ? (
            <Image
              className={classes.logo}
              src={`${getBaseApiUrl()}/static/tournament-logos/${tournamentData.logo_path}`}
              alt={i18n.t('logo_alt_tournament')}
            />
          ) : null}
          <div style={{ minWidth: 0 }}>
            <Title order={1} className={classes.title}>
              {tournamentData.name}
            </Title>
            <Group gap="xs" mt={6}>
              <Badge color={finished ? 'gray' : 'brand'} variant={finished ? 'light' : 'filled'}>
                {finished ? t('public_archived_badge') : t('public_open_badge')}
              </Badge>
              {finished ? null : (
                <Text size="xs" c="dimmed">
                  {t('public_updates_automatically')}
                </Text>
              )}
            </Group>
          </div>
        </Group>
      </Container>

      <Container size="lg">
        <nav className={classes.tabs} aria-label={tournamentData.name}>
          {tabs.map((tab) => (
            <PreloadLink
              href={tab.link}
              key={tab.link}
              className={classes.tab}
              data-active={isTabActive(tab.link, pathName, base) || undefined}
            >
              <tab.icon size={18} stroke={1.8} />
              <span>{tab.label}</span>
            </PreloadLink>
          ))}
        </nav>
      </Container>
    </header>
  );
}

// Estructura común de todas las pantallas públicas de un torneo.
export function DashboardShell({
  tournamentData,
  children,
  size = 'md',
}: {
  tournamentData: Tournament;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <PublicLayout>
      <DoubleHeader tournamentData={tournamentData} />
      <Container size={size} py="lg">
        {children}
      </Container>
    </PublicLayout>
  );
}
