import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { AccentTone } from '../theme/accent-colors';

/**
 * How the deal is DOING — one axis, not two. "Health" and "priority" are the
 * same question asked twice (a high-priority deal that is fine needs no flag, a
 * stalled one is already the loudest thing on the card), and drawing both is the
 * "two controls that mean the same thing" the card exists to avoid.
 */
export type DealHealth = 'on-track' | 'at-risk' | 'stalled';

/** Who on the team is carrying the deal. */
export interface DealOwner {
  name: string;
  /** A URL or an `ImageResolver` id. Without it the avatar draws initials. */
  avatar?: string;
}

export interface DealCardProps {
  title: string;
  /** The company the deal is with. */
  account?: string;
  /**
   * PRE-FORMATTED ("€48,000", "$1.2M"). Bloom never does money maths and never
   * picks a currency, a locale or a rounding — the app has all three and the
   * card would have to guess. It is drawn on one line and never wraps.
   */
  amount?: string;
  /** Pre-formatted ("Closes 30 Sep"). */
  closeDate?: string;
  owner?: DealOwner;
  /** The stage word, for a card drawn OUTSIDE a column (a search result, a list). */
  stage?: string;
  health?: DealHealth;
  /** Overrides the health's own word. */
  healthLabel?: string;
  /**
   * How long it has been stalled, pre-formatted ("14 days"). With
   * `health="stalled"` the signal reads "Stalled for 14 days"; on any other
   * health it is ignored, because a deal that is moving has not stalled.
   */
  stalledFor?: string;
  /** Opens the deal. Bound to the title block — see `docs/pipeline.mdx`. */
  onPress?: () => void;
  /**
   * Move the deal to another stage. The BOARD DOES NOT DRAG: this is the
   * affordance that replaces it, and the app decides what it opens (a menu, a
   * sheet, a dialog).
   */
  onMove?: () => void;
  /** The move action's accessible name. Default `"Move {title}"`. */
  moveLabel?: string;
  /** Trailing slot beside the move action: a `DropdownMenu` trigger, an assign button. */
  actions?: ReactNode;
  /** Names the press target. Defaults to the title, the account and the amount. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One stage of the pipeline, as data the board can lay out without rendering it. */
export interface PipelineStage {
  /** Stable identity. Also the key the single-column layout selects by. */
  id: string;
  name: string;
  /** Deals in the stage. Drawn as a counter beside the name. */
  count?: number;
  /**
   * The summed amount, PRE-FORMATTED by the app for the same reason
   * {@link DealCardProps.amount} is.
   */
  total?: string;
  /** The stage's dot. Default `primary`. */
  tone?: AccentTone;
  /** What an empty column says. Default `"No deals in this stage"`. */
  emptyLabel?: string;
  /** Draws placeholder cards instead of the children. */
  loading?: boolean;
  /** Renders the "load more" action under the cards. */
  onLoadMore?: () => void;
  /** Default `"Load more"`. */
  loadMoreLabel?: string;
}

export interface PipelineColumnProps extends Omit<PipelineStage, 'id'> {
  /** The deal cards. */
  children?: ReactNode;
  /** A fixed width, for a column inside a horizontal board. Omitted, it fills its parent. */
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * `board` draws every column side by side in a horizontal scroller, `single`
 * draws one at a time behind a tab row, and `auto` measures its own width and
 * picks — so a board in a side panel behaves like a phone without asking the
 * window.
 */
export type PipelineBoardLayout = 'auto' | 'board' | 'single';

export interface PipelineBoardProps {
  stages: readonly PipelineStage[];
  /**
   * The CARDS of one stage. Called per rendered column — once in `single`,
   * once per stage in `board`. The board never inspects what it returns.
   */
  renderStage: (stage: PipelineStage) => ReactNode;
  /** Default `auto`. */
  layout?: PipelineBoardLayout;
  /** The visible stage in the `single` layout. Controlled. */
  stageId?: string;
  /** The stage the `single` layout opens on. Uncontrolled; defaults to the first. */
  defaultStageId?: string;
  onStageChange?: (stageId: string) => void;
  /** Column width in the `board` layout. Default 288. */
  columnWidth?: number;
  /** At or below this width `auto` picks `single`. Default 700. */
  singleMaxWidth?: number;
  /** Names the board. Required by the tab row in the `single` layout. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
