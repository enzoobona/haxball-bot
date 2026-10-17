import { Grid, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SWRResponse } from 'swr';

import MatchModal from '@components/modals/match_modal';
import { assert_not_none } from '@components/utils/assert';
import { Time } from '@components/utils/datetime';
import { TeamLink } from '@components/public/entity_links';
import { formatMatchInput1, formatMatchInput2, isMatchHappening } from '@components/utils/match';
import { TournamentMinimal } from '@components/utils/tournament';
import { MatchWithDetails, RoundWithMatches, StagesWithStageItemsResponse } from '@openapi';
import { getMatchLookup, getStageItemLookup } from '@services/lookups';
import classes from './match.module.css';

export function MatchBadge({ match }: { match: MatchWithDetails }) {
  const hasInfo = match.court != null || match.number != null;
  return (
    <div
      className={classes.badge}
      data-live={isMatchHappening(match) || undefined}
      style={{ visibility: hasInfo ? 'visible' : 'hidden' }}
    >
      {match.number != null ? <span>#{match.number}</span> : null}
      {match.court != null ? (
        <span className={classes.badgeCourt} title={match.court.name}>
          {match.court.name}
        </span>
      ) : null}
      {match.start_time != null && match.court != null ? (
        <>
          <span aria-hidden>|</span>
          <span className={classes.badgeTime}>
            <Time datetime={match.start_time} />
          </span>
        </>
      ) : null}
    </div>
  );
}

export default function Match({
  swrStagesResponse,
  swrUpcomingMatchesResponse,
  tournamentData,
  match,
  readOnly,
  round,
}: {
  swrStagesResponse: SWRResponse<StagesWithStageItemsResponse>;
  swrUpcomingMatchesResponse: SWRResponse | null;
  tournamentData: TournamentMinimal;
  match: MatchWithDetails;
  readOnly: boolean;

  round: RoundWithMatches;
}) {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const winner_style = {
    backgroundColor: theme.colors.brand[8],
    color: theme.white,
  };

  const stageItemsLookup = getStageItemLookup(swrStagesResponse);
  const matchesLookup = getMatchLookup(swrStagesResponse);

  const team1_style =
    match.stage_item_input1_score > match.stage_item_input2_score ? winner_style : {};
  const team2_style =
    match.stage_item_input1_score < match.stage_item_input2_score ? winner_style : {};

  const team1_name = formatMatchInput1(t, stageItemsLookup, matchesLookup, match);
  const team2_name = formatMatchInput2(t, stageItemsLookup, matchesLookup, match);
  // Solo la vista pública (readOnly) lleva a la página del equipo; en el admin el partido es un botón.
  const team1_label = readOnly ? (
    <TeamLink teamId={match.stage_item_input1?.team_id}>{team1_name}</TeamLink>
  ) : (
    team1_name
  );
  const team2_label = readOnly ? (
    <TeamLink teamId={match.stage_item_input2?.team_id}>{team2_name}</TeamLink>
  ) : (
    team2_name
  );

  const [opened, setOpened] = useState(false);

  const bracket = (
    <>
      <MatchBadge match={match} />
      <div className={classes.top} style={team1_style}>
        <Grid grow>
          <Grid.Col span={10}>{team1_label}</Grid.Col>
          <Grid.Col span={2}>{match.stage_item_input1_score}</Grid.Col>
        </Grid>
      </div>
      <div className={classes.divider} />
      <div className={classes.bottom} style={team2_style}>
        <Grid grow>
          <Grid.Col span={10}>{team2_label}</Grid.Col>
          <Grid.Col span={2}>{match.stage_item_input2_score}</Grid.Col>
        </Grid>
      </div>
    </>
  );

  if (readOnly) {
    return <div className={classes.root}>{bracket}</div>;
  }

  return (
    <>
      <UnstyledButton className={classes.root} onClick={() => setOpened(!opened)}>
        {bracket}
      </UnstyledButton>
      <MatchModal
        swrStagesResponse={assert_not_none(swrStagesResponse)}
        swrUpcomingMatchesResponse={swrUpcomingMatchesResponse}
        tournamentData={tournamentData}
        match={match}
        opened={opened}
        setOpened={setOpened}
        round={round}
      />
    </>
  );
}
