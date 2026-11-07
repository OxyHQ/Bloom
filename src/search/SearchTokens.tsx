import { useCallback, useContext, useMemo, useRef, type ComponentRef } from 'react';
import type { ScrollView } from 'react-native';

import { useBloomAppearance } from '../appearance';
import { Chip } from '../chip/Chip';
import { CHIP_GEOMETRY, resolveChipPaint } from '../chip/shared';
import type { ChipSize } from '../chip/types';
import { useIsRtl } from '../hooks/use-is-rtl';
import { ScrollArea } from '../layout/ScrollArea';
import { IS_WEB } from '../styles/platform';
import type { TextFieldSize } from '../text-field/shared';
import { TextFieldGroupContext } from '../text-field/TextField';
import { useTheme } from '../theme/use-theme';
import type { SearchToken } from './types';

/**
 * A token's rung for each field rung: a compact pill well inside the field,
 * as a Mac's search token sits inside its field (20 in the 28px `xs` field, 24
 * in the 32px `sm` and 36px `md`, 28 in the 44px `lg`).
 */
const TOKEN_CHIP_SIZE: Readonly<Record<TextFieldSize, ChipSize>> = {
  xs: 'xs',
  sm: 'sm',
  md: 'sm',
  lg: 'lg',
};

/** Between tokens. */
const TOKEN_GAP = 4;

/**
 * The most of the field's row the tokens take: past it they scroll sideways,
 * the latest kept in view beside the caret, and the text keeps the rest.
 */
const TOKEN_STRIP_MAX_WIDTH = '66%';

/**
 * The tokens inside a `Search` field, before its input, in order. Each is a
 * `Chip` named by its label, with a remove button ("Remove Kind: PDF"). A long
 * row scrolls rather than wrapping the field, and is scrolled to its end
 * whenever it changes, so the token nearest the caret is the one in view.
 */
export function SearchTokens({
  tokens,
  onRemoveToken,
  disabled,
}: {
  tokens: readonly SearchToken[];
  onRemoveToken?: (key: string) => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  const rtl = useIsRtl();
  const group = useContext(TextFieldGroupContext);
  // The field's rung, resolved as `TextField` resolves it: the input group's,
  // then the nearest scope's, then `md`.
  const { size: scoped } = useBloomAppearance({}, { size: 'md', tone: 'neutral' });
  const chipSize = TOKEN_CHIP_SIZE[group?.size ?? scoped];
  const geometry = CHIP_GEOMETRY[chipSize];
  const glyph = useMemo(
    () =>
      resolveChipPaint(theme, { tone: 'neutral', variant: 'subtle', selected: false }).foreground,
    [theme],
  );

  const scroller = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const keepLatestInView = useCallback(
    (contentWidth: number) => {
      const node = scroller.current;
      if (!node) return;
      // The web's right-to-left scroller counts leftwards from zero, so its end
      // is a negative offset; `scrollToEnd` would land on the start.
      if (IS_WEB && rtl) node.scrollTo({ x: -contentWidth, animated: false });
      else node.scrollToEnd({ animated: false });
    },
    [rtl],
  );

  return (
    <ScrollArea
      ref={scroller}
      horizontal
      scrollbar="never"
      keyboardShouldPersistTaps="handled"
      onContentSizeChange={keepLatestInView}
      style={{ flexGrow: 0, flexShrink: 1, minWidth: 0, maxWidth: TOKEN_STRIP_MAX_WIDTH }}
      contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: TOKEN_GAP }}
      testID="searchTokens"
    >
      {tokens.map(({ key, label, icon: Icon }) => (
        <Chip
          key={key}
          size={chipSize}
          disabled={disabled}
          accessibilityLabel={label}
          leading={
            Icon ? <Icon width={geometry.icon} height={geometry.icon} fill={glyph} /> : undefined
          }
          onClose={onRemoveToken ? () => onRemoveToken(key) : undefined}
          testID={`searchToken-${key}`}
        >
          {label}
        </Chip>
      ))}
    </ScrollArea>
  );
}
