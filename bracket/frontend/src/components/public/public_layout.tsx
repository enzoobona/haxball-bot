import { ActionIcon, Anchor, Button, Container, Group } from '@mantine/core';
import { IconBrandDiscord, IconBrandKick, IconLock } from '@tabler/icons-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardFooter } from '@components/dashboard/footer';
import { Brand } from '@components/navbar/_brand';
import { ColorSchemeToggle } from '@components/utils/color_scheme_toggle';
import PreloadLink from '@components/utils/link';
import { tokenPresent } from '@services/local_storage';
import { DISCORD_URL, STREAM_URL } from '../../config';
import classes from './public_layout.module.css';

export function PublicHeader() {
  const { t } = useTranslation();
  const isAdmin = tokenPresent();

  return (
    <header className={classes.header}>
      <Container size="lg" className={classes.inner}>
        <Brand />
        <Group gap="xs" wrap="nowrap">
          {STREAM_URL ? (
            <ActionIcon
              component="a"
              href={STREAM_URL}
              target="_blank"
              rel="noreferrer"
              size={36}
              color="green"
              variant="filled"
              aria-label={t('public_watch_stream')}
              title={t('public_watch_stream')}
            >
              <IconBrandKick size={18} />
            </ActionIcon>
          ) : null}
          {DISCORD_URL ? (
            <ActionIcon
              component="a"
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              size={36}
              variant="filled"
              className={classes.discord}
              aria-label={t('public_join_discord')}
              title={t('public_join_discord')}
            >
              <IconBrandDiscord size={18} />
            </ActionIcon>
          ) : null}
          <ColorSchemeToggle />
          <Anchor
            component={PreloadLink}
            href={isAdmin ? '/' : '/login'}
            c="dimmed"
            size="xs"
            className={classes.admin}
            visibleFrom="sm"
          >
            <IconLock size={12} style={{ marginRight: 4 }} />
            {t('public_admin_access')}
          </Anchor>
        </Group>
      </Container>
    </header>
  );
}

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={classes.page}>
      <PublicHeader />
      <main className={classes.main}>{children}</main>
      <DashboardFooter />
    </div>
  );
}
