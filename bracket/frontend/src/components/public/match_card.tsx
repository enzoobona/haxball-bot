import { Badge, Group, Paper, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { TeamLink } from './entity_links';
import { Time } from '@components/utils/datetime';
import { formatMatchInput1, formatMatchInput2, isMatchHappening } from '@components/utils/match';
import { MatchWithDetails } from '@openapi';
import { stringToColour } from '@services/lookups';
import classes from './match_card.module.css';

function TeamLine({
  name,
  teamId,
  score,
  state,
}: {
  name: string;
  teamId?: number | null;
  score: string | number;
  state: 'win' | 'lose' | 'draw' | 'pending';
}) {
  return (
    <div className={classes.team}>
      <Text className={classes.teamName} data-state={state} lineClamp={1} title={name}>
        <TeamLink teamId={teamId}>{name}</TeamLink>
      </Text>
      <div className={classes.score} data-state={state}>
        {score}
      </div>
    </div>
  );
}

export default function MatchCard({
  data,
  stageItemsLookup,
  matchesLookup,
}: {
  data: { match: MatchWithDetails; stageItem: { id: number; name: string } };
  stageItemsLookup: any;
  matchesLookup: any;
}) {
  const { t } = useTranslation();
  const { match, stageItem } = data;
  const s1 = match.stage_item_input1_score;
  const s2 = match.stage_item_input2_score;
  const pending = !match.played;
  const live = pending && match.start_time != null && isMatchHappening(match);

  const state1 = pending ? 'pending' : s1 > s2 ? 'win' : s1 < s2 ? 'lose' : 'draw';
  const state2 = pending ? 'pending' : s2 > s1 ? 'win' : s2 < s1 ? 'lose' : 'draw';

  return (
    <Paper withBorder radius="lg" className={classes.card} data-live={live || undefined}>
      <Group justify="space-between" wrap="nowrap" gap="xs" className={classes.head}>
        <Group gap="xs" wrap="nowrap">
          {live ? (
            <Badge color="brand" variant="filled" size="sm">
              {t('public_live_now')}
            </Badge>
          ) : null}
          {match.number != null ? (
            <Text size="sm" fw={800} c="brand" title={t('match_number_short', { number: match.number })}>
              #{match.number}
            </Text>
          ) : null}
          <Text size="sm" fw={700} lineClamp={1}>
            {match.court?.name}
          </Text>
          {match.start_time != null ? (
            <Text size="sm" c="dimmed">
              <Time datetime={match.start_time} />
            </Text>
          ) : null}
        </Group>
        <Badge color={stringToColour(`${stageItem.id}`)} variant="light" size="sm" maw="50%">
          {stageItem.name}
        </Badge>
      </Group>

      <div className={classes.body}>
        <TeamLine
          name={formatMatchInput1(t, stageItemsLookup, matchesLookup, match)}
          teamId={match.stage_item_input1?.team_id}
          score={pending ? '–' : s1}
          state={state1}
        />
        <TeamLine
          name={formatMatchInput2(t, stageItemsLookup, matchesLookup, match)}
          teamId={match.stage_item_input2?.team_id}
          score={pending ? '–' : s2}
          state={state2}
        />
      </div>
    </Paper>
  );
}
