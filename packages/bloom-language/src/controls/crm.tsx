import {
  ContactProfileCard as BloomContactProfileCard,
  type ContactProfileCardProps,
} from '@oxy.so/bloom/contact-card';
import {
  LeadScoreCard as BloomLeadScoreCard,
  type LeadScoreCardProps,
} from '@oxy.so/bloom/lead-score';
import {
  DealCard as BloomDealCard,
  type DealCardProps,
  PipelineBoard as BloomPipelineBoard,
  type PipelineBoardProps,
  PipelineColumn as BloomPipelineColumn,
  type PipelineColumnProps,
  type PipelineStage,
} from '@oxy.so/bloom/pipeline';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlDensity, PipelineLayout, SpaceToken } from '../tokens';
import type { ControlDraw, ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** A CRM's records: a contact, a lead's score, deals and the board they move on. */
export type CrmKind =
  | 'contactProfileCard'
  | 'leadScoreCard'
  | 'dealCard'
  | 'pipelineColumn'
  | 'pipelineBoard';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

/** Bloom `ContactProfileCard`'s data; its `actions` are language children. */
export type ContactProfileCardOptions = Omit<
  ContactProfileCardProps,
  Drawn | 'name' | 'density' | 'onPress' | 'actions'
> & { readonly actions?: Child };
/** Bloom `LeadScoreCard`'s data; it is named with `.label()`. */
export type LeadScoreCardOptions = Omit<LeadScoreCardProps, Drawn | 'score'>;
/** Bloom `DealCard`'s data; its `actions` are language children. */
export type DealCardOptions = Omit<DealCardProps, Drawn | 'title' | 'onPress' | 'actions'> & {
  readonly actions?: Child;
};
/** A stage's data (Bloom's `PipelineStage` but its name); its width a space token. */
export type PipelineColumnOptions = Omit<
  PipelineColumnProps,
  'style' | 'testID' | 'name' | 'children' | 'width'
> & { readonly width?: SpaceToken };
/** Bloom `PipelineBoard`'s data; a stage's column is a language view, its widths space tokens. */
export type PipelineBoardOptions = Omit<
  PipelineBoardProps,
  Drawn | 'stages' | 'renderStage' | 'layout' | 'columnWidth' | 'singleMaxWidth'
> & { readonly columnWidth?: SpaceToken; readonly singleMaxWidth?: SpaceToken };

/** Bloom `ContactProfileCard`; `.onPress()` opens the record. */
export interface ContactProfileCardView extends ViewModifiers<ContactProfileCardView> {
  /** `default` (Bloom's comfortable) or `compact`. */
  density(value: ControlDensity): ContactProfileCardView;
}
export type LeadScoreCardView = ViewModifiers<LeadScoreCardView>;
/** Bloom `DealCard`; `.onPress()` opens the deal. */
export type DealCardView = ViewModifiers<DealCardView>;
export type PipelineColumnView = ViewModifiers<PipelineColumnView>;
export interface PipelineBoardView extends ViewModifiers<PipelineBoardView> {
  /** `auto` (default), `board` or `single`. */
  style(value: PipelineLayout): PipelineBoardView;
}

export function ContactProfileCard(
  name: string,
  options: ContactProfileCardOptions = {},
): ContactProfileCardView {
  return new Node('contactProfileCard', { name, options }, []);
}
/** Bloom `LeadScoreCard` of `score` (out of its `max`, 100 by default). */
export function LeadScoreCard(
  score: number,
  options: LeadScoreCardOptions = {},
): LeadScoreCardView {
  return new Node('leadScoreCard', { score, options }, []);
}
export function DealCard(title: string, options: DealCardOptions = {}): DealCardView {
  return new Node('dealCard', { title, options }, []);
}
/** Bloom `PipelineColumn`: a stage named `name`, its deals the content. */
export function PipelineColumn(
  name: string,
  deals: Child,
  options: PipelineColumnOptions = {},
): PipelineColumnView {
  return new Node('pipelineColumn', { name, options }, [deals]);
}
/** Bloom `PipelineBoard` of `stages`, each stage's column drawn by `renderStage`. */
export function PipelineBoard(
  stages: readonly PipelineStage[],
  renderStage: (stage: PipelineStage) => Child,
  options: PipelineBoardOptions = {},
): PipelineBoardView {
  return new Node('pipelineBoard', { stages, renderStage, options }, []);
}

export const CRM: Record<CrmKind, ControlRenderer> = {
  contactProfileCard: product(BloomContactProfileCard, {
    press: true,
    slots: ['actions'],
    own: (d) => ({ density: rowDensity(d) }),
  }),
  leadScoreCard: product(BloomLeadScoreCard),
  dealCard: product(BloomDealCard, { press: true, slots: ['actions'] }),
  pipelineColumn: product(BloomPipelineColumn, { lengths: ['width'] }),
  pipelineBoard: product(BloomPipelineBoard, {
    lengths: ['columnWidth', 'singleMaxWidth'],
    own: (d: ControlDraw) => {
      const { renderStage } = d.node.props as {
        renderStage: (stage: PipelineStage) => Child;
      };
      return {
        renderStage: (stage: PipelineStage) => d.render(renderStage(stage)),
        layout: d.own('style')?.value,
      };
    },
  }),
};
