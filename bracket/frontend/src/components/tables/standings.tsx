import {
  Avatar,
  Badge,
  Center,
  Group,
  Paper,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';

import { useTranslation } from 'react-i18next';

import { EmptyTableInfo } from '@components/no_content/empty_table_info';
import { formatStageItemInput } from '@components/utils/stage_item_input';
import { getBaseApiUrl } from '@services/adapter';

import {
  StageItemInputFinal,
  StageItemWithRounds,
} from '@openapi';

import {
  ThNotSortable,
  ThSortable,
  getTableState,
  sortTableEntries,
} from './table';

import TableLayoutLarge from './table_large';

function getPositionVariant(position: number) {
  if (position === 1) return 'filled';
  if (position === 2) return 'light';
  if (position === 3) return 'light';
    return 'light';
  }

function getPositionColor(position: number) {
  if (position === 1) return 'yellow';
  if (position === 2) return 'gray';
  if (position === 3) return 'orange';
    return undefined;
  }

export function StandingsTableForStageItem({
  teams_with_inputs,
  stageItem,
  stageItemsLookup,
  maxTeamsToDisplay,
}: {
  teams_with_inputs: StageItemInputFinal[];
  stageItem: StageItemWithRounds;
  fontSizeInPixels?: number;
  stageItemsLookup: any;
  maxTeamsToDisplay: number;
}) {
  const { t } = useTranslation();

  const tableState = getTableState('points', false);

  const sortedTeams = [...teams_with_inputs].sort((p1, p2) => {
    const pointsComparison =
      Number(p2.points ?? 0) - Number(p1.points ?? 0);

    if (pointsComparison !== 0) {
      return pointsComparison;
    }

    const winsComparison =
      (p2.wins ?? 0) - (p1.wins ?? 0);

    if (winsComparison !== 0) {
      return winsComparison;
    }

    const drawsComparison =
      (p2.draws ?? 0) - (p1.draws ?? 0);

    if (drawsComparison !== 0) {
      return drawsComparison;
    }

    return sortTableEntries(p1, p2, tableState);
});

  const rows = sortedTeams
  .slice(0, maxTeamsToDisplay)
  .map((team_with_input, index) => {
  const played =
  (team_with_input.wins ?? 0) +
  (team_with_input.draws ?? 0) +
  (team_with_input.losses ?? 0);

    const teamName = formatStageItemInput(
      team_with_input,
      stageItemsLookup,
    );

    const team = team_with_input.team;

    return (
      <Table.Tr key={team_with_input.id}>
        <Table.Td style={{ width: '4rem' }}>
          <Center>
            <Badge
              variant={getPositionVariant(index + 1)}
              color={getPositionColor(index + 1)}
              size="lg"
              radius="md"
            >
              {index + 1}
            </Badge>
          </Center>
        </Table.Td>

        <Table.Td>
          <Group gap="sm" wrap="nowrap">
            <Avatar
              src={
                team.logo_path
                  ? `${getBaseApiUrl()}/static/team-logos/${team.logo_path}`
                  : null
              }
              alt={team.name}
              radius="xl"
              size="2.25rem"
            >
              {team.name.slice(0, 2).toUpperCase()}
            </Avatar>

            <Tooltip label={teamName ?? team.name}>
              <Text
                fw={600}
                truncate
                lineClamp={1}
              >
                {teamName ?? team.name}
              </Text>
            </Tooltip>
          </Group>
        </Table.Td>

        <Table.Td
          visibleFrom="xs"
          style={{ width: '5rem', textAlign: 'center' }}
        >
          <Text fw={500}>
            {played}
          </Text>
        </Table.Td>

        <Table.Td
          visibleFrom="sm"
          style={{ width: '5rem', textAlign: 'center' }}
        >
          <Text fw={500}>
            {team_with_input.wins ?? 0}
          </Text>
        </Table.Td>

        <Table.Td
          visibleFrom="sm"
          style={{ width: '5rem', textAlign: 'center' }}
        >
          <Text fw={500}>
            {team_with_input.draws ?? 0}
          </Text>
        </Table.Td>

        <Table.Td
          visibleFrom="sm"
          style={{ width: '5rem', textAlign: 'center' }}
        >
          <Text fw={500}>
            {team_with_input.losses ?? 0}
          </Text>
        </Table.Td>

        <Table.Td style={{ width: '6rem', textAlign: 'center' }}>
          <Text fw={800} size="lg">
            {team_with_input.points ?? 0}
          </Text>
        </Table.Td>
      </Table.Tr>
    );
  });

  if (rows.length < 1) {
    return (
    <EmptyTableInfo entity_name={t('teams_title')} />
    );
  }

  return (
    <Paper
    withBorder
    radius="lg"
    shadow="xs"
    style={{ overflow: 'hidden' }}
    > <TableLayoutLarge display_mode="presentation">
    <Table.Thead>
    <Table.Tr> <ThNotSortable>#</ThNotSortable>
            <ThSortable
              state={tableState}
              field="name"
            >
              {t('name_table_header')}
            </ThSortable>

            <ThNotSortable visibleFrom="xs">
              PJ
            </ThNotSortable>

            <ThNotSortable visibleFrom="sm">
              V
            </ThNotSortable>

            <ThNotSortable visibleFrom="sm">
              E
            </ThNotSortable>

            <ThNotSortable visibleFrom="sm">
              D
            </ThNotSortable>

            <ThSortable
              state={tableState}
              field="points"
            >
              {t('points_table_header')}
            </ThSortable>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {rows}
        </Table.Tbody>
      </TableLayoutLarge>
    </Paper>


  );
}
