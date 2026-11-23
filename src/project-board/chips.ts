import type { TextStyle, ViewStyle } from 'react-native';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { createTokenStyles } from '../theme/color-tokens';
import { CARD_SHADOW, TAILWIND_SHADOW, TYPE } from './styles';

/** The board's pill on `Chip`: a 6px corner, 6×2 padding, its label on one line. */
export const BOARD_CHIP: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 6,
  paddingInline: 6,
  paddingBlock: 2,
  ...(IS_WEB
    ? ({
        whiteSpace: 'nowrap',
        transitionProperty: 'padding,font-size',
        // `ease` is no Tailwind utility: the default curve.
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '200ms',
      } as WebCssStyle)
    : null),
};

/** A card's pill, `text-body-2-medium` (the type sits on the box as the class set it). */
export const CARD_CHIP: TextStyle = { ...BOARD_CHIP, ...TYPE.caption };
/** A dialog's pill: 7px sides, `text-body-medium`. */
export const DIALOG_CHIP: TextStyle = { ...BOARD_CHIP, paddingInline: 7, ...TYPE.body };

/** The detail dialog's priority pill fades its colours instead (`duration-200` outranked its `duration-150`). */
export const COLOR_TRANSITION: ViewStyle | undefined = IS_WEB
  ? ({
      transitionProperty:
        'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to',
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transitionDuration: '200ms',
    } as WebCssStyle)
  : undefined;

/** Each priority's pill (`bg-status-*-background text-status-*-text`). */
export const useChipFills = createTokenStyles((t) => ({
  Low: { backgroundColor: t.infoSubtle, color: t.infoText },
  Medium: { backgroundColor: t.warningSubtle, color: t.warningText },
  High: { backgroundColor: t.warningSubtle, color: t.warningText },
  Urgent: { backgroundColor: t.errorSubtle, color: t.errorText },
}));

/** Each priority's label (`text-status-*-text`). */
export const useChipLabels = createTokenStyles((t) => ({
  Low: { color: t.infoText },
  Medium: { color: t.warningText },
  High: { color: t.warningText },
  Urgent: { color: t.errorText },
}));

/**
 * The card's project pill: the card's fill inside a 1px inset `border` ring.
 * On native the ring's shadow stack also carried the card's own shadow, which
 * react-native-css let the pill inherit; the web's shadow variables do not.
 */
export const useProjectChip = createTokenStyles((t) => ({
  chip: {
    gap: 4,
    ...TYPE.caption,
    color: t.foreground,
    backgroundColor: t.card,
    ...(IS_WEB
      ? { boxShadow: TAILWIND_SHADOW(`inset 0 0 0 1px ${t.border}`, '0 0 #0000') }
      : {
          boxShadow: [
            {
              inset: true,
              offsetX: 0,
              offsetY: 0,
              blurRadius: 0,
              spreadDistance: 1,
              color: t.border,
            },
            CARD_SHADOW,
          ],
        }),
  },
}));
