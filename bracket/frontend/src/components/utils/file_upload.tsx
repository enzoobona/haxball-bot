import { Group, Text } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { showNotification } from '@mantine/notifications';
import { IconCloudUpload, IconDownload, IconX } from '@tabler/icons-react';
import { AxiosError } from 'axios';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SWRResponse } from 'swr';

import {
  FullTeamWithPlayers,
  TeamsWithPlayersResponse,
  Tournament,
  TournamentResponse,
} from '@openapi';
import { handleRequestError, uploadTeamLogo, uploadTournamentLogo } from '@services/adapter';

export function DropzoneButton({
  tournamentId,
  swrResponse: swrTeamsResponse,
  variant,
  teamId,
}: {
  tournamentId: Tournament['id'];
  swrResponse: SWRResponse<TeamsWithPlayersResponse> | SWRResponse<TournamentResponse>;
  variant: 'tournament' | 'team';
  teamId?: FullTeamWithPlayers['id'];
}) {
  // const { classes, theme } = useStyles();
  const openRef = useRef<() => void>(null);
  const { t } = useTranslation();

  const useUploadLogo = useMemo(() => {
    if (variant === 'tournament') {
      return uploadTournamentLogo.bind(null, tournamentId);
    }

    if (teamId === undefined) throw new TypeError('Team is undefined');
    return uploadTeamLogo.bind(null, tournamentId, teamId);
  }, [tournamentId, teamId, variant]);

  return (
    <div>
      <Dropzone
        mt="lg"
        openRef={openRef}
        onDrop={async (files) => {
          try {
            await useUploadLogo(files[0]);
          } catch (exc: any) {
            // Antes el error se perdía en silencio y parecía que el logo se había subido.
            if (exc?.name === 'AxiosError') {
              handleRequestError(exc as AxiosError);
              return;
            }
            throw exc;
          }
          await swrTeamsResponse.mutate();
        }}
        onReject={() =>
          showNotification({
            color: 'red',
            title: t('error_title'),
            message: t('dropzone_reject_text'),
          })
        }
        // className={classes.dropzone}
        radius="md"
        accept={[MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.webp]}
        maxSize={5 * 1024 ** 2}
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group justify="center">
            <Dropzone.Accept>
              <IconDownload size={50} stroke={1.5} />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={50} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload size={50} stroke={1.5} />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} size="lg" mt="xl">
            <Dropzone.Accept>{t('dropzone_accept_text')}</Dropzone.Accept>
            <Dropzone.Reject>{t('dropzone_reject_text')}</Dropzone.Reject>
            <Dropzone.Idle>{t('dropzone_idle_text')}</Dropzone.Idle>
          </Text>
          <Text ta="center" size="sm" mt="xs" c="dimmed">
            {t(`upload_placeholder_${variant}`)}
            <br />
            {t('dropzone_reject_text')}
          </Text>
        </div>
      </Dropzone>
    </div>
  );
}