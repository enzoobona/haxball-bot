import { Button, Group, Modal, Select, Text } from '@mantine/core';
import { IconLink } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SWRResponse } from 'swr';

import { PlayerWithProfile, PlayersResponse } from '@openapi';
import { PlayerProfilePublic, linkPlayerToProfile, searchProfiles } from '@services/haxball';

/**
 * Vincula a mano una fila de jugador del torneo con un jugador con cuenta (o la desvincula).
 * Es el camino para torneos viejos y para nombres que no coinciden con el de la cuenta.
 */
export default function PlayerProfileLinkModal({
  tournament_id,
  player,
  swrPlayersResponse,
}: {
  tournament_id: number;
  player: PlayerWithProfile;
  swrPlayersResponse: SWRResponse<PlayersResponse>;
}) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<PlayerProfilePublic[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) {
      return undefined;
    }
    // Pequeña espera para no pedir en cada tecla.
    const timer = setTimeout(async () => {
      setProfiles(await searchProfiles(search));
    }, 250);
    return () => clearTimeout(timer);
  }, [opened, search]);

  async function save(profileId: number | null) {
    const response = await linkPlayerToProfile(tournament_id, player.id, profileId);
    if (response != null) {
      await swrPlayersResponse.mutate();
      setOpened(false);
      setSelected(null);
    }
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('player_profile_link_title', { name: player.name })}
      >
        <Text size="sm" c="dimmed" mb="sm">
          {t('player_profile_link_description')}
        </Text>

        <Select
          searchable
          data={profiles.map((profile) => ({ value: String(profile.id), label: profile.name }))}
          value={selected}
          onChange={setSelected}
          onSearchChange={setSearch}
          searchValue={search}
          nothingFoundMessage="—"
          placeholder={t('player_profile_link_search')}
          // La búsqueda se hace en el servidor: no se filtra de nuevo acá.
          filter={({ options }) => options}
        />

        <Group mt="md" justify="space-between">
          {player.profile_id != null ? (
            <Button color="red" variant="light" onClick={() => save(null)}>
              {t('player_profile_unlink_button')}
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={selected == null} onClick={() => save(Number(selected))}>
            {t('player_profile_link_save')}
          </Button>
        </Group>
      </Modal>

      <Button
        size="xs"
        variant="light"
        style={{ marginRight: 10 }}
        leftSection={<IconLink size={16} />}
        onClick={() => setOpened(true)}
        title={t('player_profile_link_button')}
      >
        {player.profile_id != null ? (player.profile_name ?? '#') : t('player_profile_none')}
      </Button>
    </>
  );
}
