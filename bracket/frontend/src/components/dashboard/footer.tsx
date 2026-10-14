import { Anchor, Container, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { BrandFooter } from '@components/navbar/_brand';
import { DISCORD_URL, STREAM_URL } from '../../config';
import classes from './footer.module.css';

export function DashboardFooter() {
  const { t } = useTranslation();

  return (
    <div className={classes.footer}>
      <Container size="lg" className={classes.inner}>
        <BrandFooter />
        <Group className={classes.links} gap="lg">
          {STREAM_URL ? (
            <Anchor c="dimmed" href={STREAM_URL} size="sm" target="_blank" rel="noreferrer">
              {t('public_watch_stream')}
            </Anchor>
          ) : null}
          {DISCORD_URL ? (
            <Anchor c="dimmed" href={DISCORD_URL} size="sm" target="_blank" rel="noreferrer">
              {t('public_join_discord')}
            </Anchor>
          ) : null}
          <Text c="dimmed" size="xs">
            <Anchor
              c="dimmed"
              href="https://github.com/evroon/bracket"
              size="xs"
              target="_blank"
              rel="noreferrer"
            >
              {t('public_powered_by')}
            </Anchor>
          </Text>
        </Group>
      </Container>
    </div>
  );
}
