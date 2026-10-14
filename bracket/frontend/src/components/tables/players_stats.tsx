import { Center, Pagination, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SWRResponse } from 'swr';

import { NoContent } from '@components/no_content/empty_table_info';
import RequestErrorAlert from '@components/utils/error_alert';
import { TableSkeletonSingleColumn } from '@components/utils/skeletons';
import { Player, PlayersResponse } from '@openapi';

import TableLayout, { TableState, ThSortable, sortTableEntries } from './table';

export default function PlayersStatsTable({
  swrPlayersResponse,
  tableState,
  playerCount,
}: {
  swrPlayersResponse: SWRResponse<PlayersResponse>;
  tableState: TableState;
  playerCount: number;
}) {
  const { t } = useTranslation();

  const players: Player[] = swrPlayersResponse.data?.data.players ?? [];

  if (swrPlayersResponse.error) {
    return <RequestErrorAlert error={swrPlayersResponse.error} />;
  }

  if (swrPlayersResponse.isLoading) {
    return <TableSkeletonSingleColumn />;
  }

  const rows = [...players]
    .sort((p1, p2) => sortTableEntries(p1, p2, tableState))
    .map((player) => {
      const played = (player.wins ?? 0) + (player.draws ?? 0) + (player.losses ?? 0);

      return (
        <Table.Tr key={player.id}>
          <Table.Td>
            <Text>{player.name}</Text>
          </Table.Td>

          <Table.Td>
            <Text fw={700}>{played}</Text>
          </Table.Td>

          <Table.Td>
            <Text fw={700}>{player.goals ?? 0}</Text>
          </Table.Td>

          <Table.Td>
            <Text fw={700}>{player.assists ?? 0}</Text>
          </Table.Td>

          <Table.Td>{player.own_goals ?? 0}</Table.Td>

          <Table.Td>{player.wins}</Table.Td>

          <Table.Td>{player.draws}</Table.Td>

          <Table.Td>{player.losses}</Table.Td>
        </Table.Tr>
      );
    });

  if (rows.length < 1) {
    return <NoContent title={t('no_players_title')} />;
  }

  return (
    <>
      <TableLayout miw={900}>
        <Table.Thead>
          <Table.Tr>
            <ThSortable state={tableState} field="name">
              {t('name_table_header')}
            </ThSortable>

            <Table.Th>PJ</Table.Th>

            <ThSortable state={tableState} field="goals">
              Goles
            </ThSortable>

            <ThSortable state={tableState} field="assists">
              Asistencias
            </ThSortable>

            <ThSortable state={tableState} field="own_goals">
              Goles en contra
            </ThSortable>

            <ThSortable state={tableState} field="wins">
              Victorias
            </ThSortable>

            <ThSortable state={tableState} field="draws">
              Empates
            </ThSortable>

            <ThSortable state={tableState} field="losses">
              Derrotas
            </ThSortable>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>{rows}</Table.Tbody>
      </TableLayout>

      <Center mt="1rem">
        <Pagination
          value={tableState.page}
          onChange={tableState.setPage}
          total={Math.ceil(playerCount / tableState.pageSize)}
          size="lg"
        />
      </Center>
    </>
  );
}
