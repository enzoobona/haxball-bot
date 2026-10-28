import {
  ActionIcon,
  Alert,
  Button,
  CopyButton,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { IconCheck, IconCopy, IconLink, IconLogout } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';

import PublicLayout from '@components/public/public_layout';
import { DateTime } from '@components/utils/datetime';
import RequestErrorAlert from '@components/utils/error_alert';
import { TableSkeletonSingleColumn } from '@components/utils/skeletons';
import { checkForAuthError } from '@services/adapter';
import {
  LinkCode,
  MyHaxball,
  createLinkCode,
  createMyProfile,
  deleteMyIdentity,
  getMyHaxball,
  renameMyProfile,
} from '@services/haxball';
import { performLogoutAndRedirect, tokenPresent } from '@services/local_storage';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Text fw={700} fz="1.6rem">
        {value}
      </Text>
    </Paper>
  );
}

function NameForm({
  initialName,
  buttonLabel,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  buttonLabel: string;
  onSubmit: (name: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: { name: initialName },
    validate: {
      name: (value) =>
        value.trim().length >= 2 && value.trim().length <= 30 ? null : t('too_short_name_validation'),
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        await onSubmit(values.name.trim());
      })}
    >
      <Group align="flex-end" wrap="nowrap">
        <TextInput
          style={{ flex: 1 }}
          label={t('player_name_label')}
          placeholder={t('player_name_placeholder')}
          maxLength={30}
          {...form.getInputProps('name')}
        />
        <Button type="submit">{buttonLabel}</Button>
        {onCancel != null ? (
          <Button variant="default" onClick={onCancel}>
            {t('player_cancel')}
          </Button>
        ) : null}
      </Group>
    </form>
  );
}

function LinkSection({ data, onChanged }: { data: MyHaxball; onChanged: () => Promise<any> }) {
  const { t } = useTranslation();
  const [code, setCode] = useState<LinkCode | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const identitiesWhenGenerated = useRef(0);

  async function generate() {
    setLoading(true);
    const newCode = await createLinkCode();
    setLoading(false);

    if (newCode != null) {
      identitiesWhenGenerated.current = data.identities.length;
      setExpired(false);
      setCode(newCode);
    }
  }

  // El código vence a los pocos minutos.
  useEffect(() => {
    if (code == null) {
      return undefined;
    }
    const remaining = dayjs(code.expires_at).diff(dayjs());
    if (remaining <= 0) {
      setExpired(true);
      return undefined;
    }
    const timer = setTimeout(() => setExpired(true), remaining);
    return () => clearTimeout(timer);
  }, [code]);

  // Mientras el código está activo, se vuelve a consultar para detectar cuándo se vinculó.
  useEffect(() => {
    if (code == null || expired) {
      return undefined;
    }
    const interval = setInterval(() => {
      onChanged();
    }, 4000);
    return () => clearInterval(interval);
  }, [code, expired]);

  useEffect(() => {
    if (code != null && data.identities.length > identitiesWhenGenerated.current) {
      setCode(null);
      showNotification({
        color: 'green',
        icon: <IconCheck />,
        title: t('player_link_button'),
        message: '',
      });
    }
  }, [data.identities.length]);

  const limitReached = data.identities.length >= data.max_identities;
  const command = code != null ? `!vincular ${code.code}` : '';

  return (
    <Paper withBorder p="lg" radius="md">
      <Title order={3}>{t('player_browsers_title')}</Title>
      <Text c="dimmed" size="sm" mt={4} mb="md">
        {t('player_browsers_description')}
      </Text>

      {data.identities.length < 1 ? (
        <Text size="sm">{t('player_browsers_none')}</Text>
      ) : (
        <Table withRowBorders verticalSpacing="xs" mb="md">
          <Table.Tbody>
            {data.identities.map((identity) => (
              <Table.Tr key={identity.id}>
                <Table.Td>
                  <Text size="sm" ff="monospace">
                    {t('player_browser_label')} {identity.auth_hint}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    <DateTime datetime={identity.created} />
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    onClick={async () => {
                      await deleteMyIdentity(identity.id);
                      await onChanged();
                    }}
                  >
                    {t('player_unlink_button')}
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {code != null && !expired ? (
        <Alert color="green" radius="md" title={t('player_link_code_title')} mb="md">
          <Text size="sm">{t('player_link_code_instructions')}</Text>
          <Group mt="xs" gap="xs" wrap="nowrap">
            <Text ff="monospace" fw={700} fz="1.6rem" style={{ wordBreak: 'break-all' }}>
              {command}
            </Text>
            <CopyButton value={command} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? t('player_copied') : t('player_copy')} withArrow>
                  <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy}>
                    {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            {t('player_link_code_hint', { time: dayjs(code.expires_at).format('HH:mm') })}
          </Text>
        </Alert>
      ) : null}

      {code != null && expired ? (
        <Alert color="orange" radius="md" mb="md">
          {t('player_link_code_expired')}
        </Alert>
      ) : null}

      <Group>
        <Button
          leftSection={<IconLink size={16} />}
          loading={loading}
          disabled={limitReached}
          onClick={generate}
        >
          {code != null ? t('player_link_code_new') : t('player_link_button')}
        </Button>
        <Text size="xs" c="dimmed">
          {t('player_browsers_limit', { count: data.max_identities })}
        </Text>
      </Group>
    </Paper>
  );
}

function StatsSection({ data }: { data: MyHaxball }) {
  const { t } = useTranslation();
  const { stats } = data;
  const goalsPerMatch =
    stats.matches_played > 0 ? (stats.goals / stats.matches_played).toFixed(2) : '–';

  return (
    <Stack gap="md">
      <Title order={3}>{t('player_stats_title')}</Title>
      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <StatCard label={t('player_stat_tournaments')} value={stats.tournaments} />
        <StatCard label={t('player_stat_matches')} value={stats.matches_played} />
        <StatCard label={t('player_stat_goals')} value={stats.goals} />
        <StatCard label={t('player_stat_assists')} value={stats.assists} />
        <StatCard label={t('player_stat_wins')} value={stats.wins} />
        <StatCard label={t('player_stat_draws')} value={stats.draws} />
        <StatCard label={t('player_stat_losses')} value={stats.losses} />
        <StatCard label={t('player_stat_goals_per_match')} value={goalsPerMatch} />
      </SimpleGrid>

      {data.tournaments.length < 1 ? (
        <Text c="dimmed" size="sm">
          {t('player_no_stats')}
        </Text>
      ) : (
        <>
          <Title order={4} mt="sm">
            {t('player_tournaments_title')}
          </Title>
          <div style={{ overflowX: 'auto' }}>
            <Table miw={560} withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('name_table_header')}</Table.Th>
                  <Table.Th ta="center">PJ</Table.Th>
                  <Table.Th ta="center">{t('player_stat_goals')}</Table.Th>
                  <Table.Th ta="center">{t('player_stat_assists')}</Table.Th>
                  <Table.Th ta="center">{t('player_stat_wins')}</Table.Th>
                  <Table.Th ta="center">{t('player_stat_draws')}</Table.Th>
                  <Table.Th ta="center">{t('player_stat_losses')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.tournaments.map((row) => (
                  <Table.Tr key={row.tournament_id}>
                    <Table.Td>{row.tournament_name}</Table.Td>
                    <Table.Td ta="center">{row.wins + row.draws + row.losses}</Table.Td>
                    <Table.Td ta="center">{row.goals}</Table.Td>
                    <Table.Td ta="center">{row.assists}</Table.Td>
                    <Table.Td ta="center">{row.wins}</Table.Td>
                    <Table.Td ta="center">{row.draws}</Table.Td>
                    <Table.Td ta="center">{row.losses}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </>
      )}
    </Stack>
  );
}

function PlayerPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);

  const swrMine = getMyHaxball();
  checkForAuthError(swrMine);
  const data = swrMine.data?.data ?? null;

  let content = null;

  if (swrMine.error) {
    content = <RequestErrorAlert error={swrMine.error} />;
  } else if (data == null) {
    content = <TableSkeletonSingleColumn />;
  } else if (data.profile == null) {
    content = (
      <Paper withBorder p="lg" radius="md" maw="40rem">
        <Title order={3}>{t('player_create_title')}</Title>
        <Text c="dimmed" size="sm" mt={4} mb="md">
          {t('player_create_description')}
        </Text>
        <NameForm
          initialName=""
          buttonLabel={t('player_create_button')}
          onSubmit={async (name) => {
            const response = await createMyProfile(name);
            if (response != null) {
              await swrMine.mutate();
            }
            return response != null;
          }}
        />
      </Paper>
    );
  } else {
    content = (
      <Stack gap="xl">
        {renaming ? (
          <Paper withBorder p="lg" radius="md" maw="40rem">
            <NameForm
              initialName={data.profile.name}
              buttonLabel={t('save_button')}
              onCancel={() => setRenaming(false)}
              onSubmit={async (name) => {
                const response = await renameMyProfile(name);
                if (response != null) {
                  await swrMine.mutate();
                  setRenaming(false);
                }
                return response != null;
              }}
            />
          </Paper>
        ) : (
          <Group>
            <Title order={2}>{data.profile.name}</Title>
            <Button size="xs" variant="subtle" onClick={() => setRenaming(true)}>
              {t('player_rename_button')}
            </Button>
          </Group>
        )}

        <StatsSection data={data} />
        <LinkSection data={data} onChanged={() => swrMine.mutate()} />
      </Stack>
    );
  }

  return (
    <PublicLayout>
      <Container size="lg" py="xl">
        <Group justify="space-between" mb="xl">
          <Title>{t('player_page_title')}</Title>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconLogout size={16} />}
            onClick={() => performLogoutAndRedirect(t, navigate)}
          >
            {t('logout_title')}
          </Button>
        </Group>
        {content}
      </Container>
    </PublicLayout>
  );
}

// "Mi jugador": lo único que ve un usuario con cuenta además de la parte pública.
export default function PlayerPage() {
  if (!tokenPresent()) {
    return <Navigate to="/login" replace />;
  }

  return <PlayerPageContent />;
}
