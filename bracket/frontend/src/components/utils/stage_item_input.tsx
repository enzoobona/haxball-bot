import {
  StageItemInputEmpty,
  StageItemInputFinal,
  StageItemInputOptionFinal,
  StageItemInputOptionTentative,
  StageItemInputTentative,
} from '@openapi';
import i18n from 'i18next';
import { assert_not_none } from './assert';

export type StageItemInput = StageItemInputTentative | StageItemInputFinal | StageItemInputEmpty;
export type StageItemInputOption = StageItemInputOptionTentative | StageItemInputOptionFinal;

export interface StageItemInputChoice {
  value: string;
  label: string;
  team_id: number | null;
  winner_from_stage_item_id: number | null;
  winner_position: number | null;
  already_taken: boolean;
}

export function getPositionName(position: number) {
  return `${position}`;
}

export function formatStageItemInputTentative(
  stage_item_input: StageItemInputTentative | StageItemInputOptionTentative,
  stageItemsLookup: any,
) {
  return i18n.t('position_of', {
    position: getPositionName(assert_not_none(stage_item_input.winner_position)),
    group: stageItemsLookup[assert_not_none(stage_item_input.winner_from_stage_item_id)].name,
  });
}

export function formatStageItemInput(
  stage_item_input: StageItemInput | null | undefined,
  stageItemsLookup: any,
) {
  if (stage_item_input == null) return null;
  if ('team' in stage_item_input) return stage_item_input.team.name;
  if (stage_item_input?.winner_from_stage_item_id != null) {
    return formatStageItemInputTentative(stage_item_input, stageItemsLookup);
  }
  return null;
}
