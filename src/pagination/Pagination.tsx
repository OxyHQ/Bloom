import React, { memo, useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography/Typography';
import { borderRadius } from '../styles/tokens';
import { useInteractionState } from '../hooks/use-interaction-state';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { Button } from '../button';
import { BUTTON_SHADOW, resolveButtonRamps } from '../button/shared';
import { RiArrowLeftLine as ArrowLeft } from '../icons/remix/RiArrowLeftLine';
import { RiArrowRightLine as ArrowRight } from '../icons/remix/RiArrowRightLine';
import type { Theme } from '../theme/types';
import type { PaginationProps } from './types';

/**
 * The pagination, coloured from Bloom's theme through the ramps
 * in `button/shared.ts`.
 *
 *   row        Previous · pages · Next, space-between, gap 8
 *   prev/next  Bloom `Button` secondary, small (32), Remix arrow-left/right-line
 *   pages      gap 2; each cell 32×32, body-medium (Inter 14/20 500)
 *   current    card surface, 1px border/button/default, shadow-xs, text-primary
 *   inactive   text-secondary; hover background/secondary/hover, text-primary
 *   ellipsis   32×32, text-tertiary, not focusable
 *
 *   border/button/default         neutral-200 / dark neutral-700
 *   current surface               card       / dark neutral-800
 *   background/secondary/hover    neutral-200 / dark neutral-800
 *   text-secondary                neutral-500 (both modes)
 *   text-tertiary                 neutral-400 / dark neutral-600
 *
 * Bloom's cells are circles, like every other
 * button-like control. No transition on the cells: animating the
 * fill makes the previous page visibly fade out on every change.
 *
 * Below {@link COMPACT_WIDTH} (measured with `onLayout`, so it works on native
 * too) Previous/Next drop their labels and `siblingCount` clamps to 0.
 */

const COMPACT_WIDTH = 420;
const CELL = 32;
const DOTS = 'dots' as const;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * The pages to show, with `'dots'` where a run collapses: always the first and
 * last page, the current page and `sibling` pages either side of it.
 */
export function paginationRange(
  current: number,
  total: number,
  sibling: number,
): Array<number | typeof DOTS> {
  // first + last + current + 2*sibling + 2 dots
  const totalPageNumbers = sibling * 2 + 5;
  if (totalPageNumbers >= total) return range(1, total);

  const leftSibling = Math.max(current - sibling, 1);
  const rightSibling = Math.min(current + sibling, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 2;

  if (!showLeftDots && showRightDots) return [...range(1, 3 + 2 * sibling), DOTS, total];
  if (showLeftDots && !showRightDots) return [1, DOTS, ...range(total - (2 + 2 * sibling), total)];
  return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, total];
}

interface PaginationPalette {
  currentBackground: string;
  currentBorder: string;
  primary: string;
  secondary: string;
  tertiary: string;
  hover: string;
  shadow: string;
  ring: string;
}

function resolvePaginationPalette(theme: Theme): PaginationPalette {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  return theme.isDark
    ? {
        currentBackground: n[800],
        currentBorder: n[700],
        primary: theme.colors.text,
        secondary: n[500],
        tertiary: n[600],
        hover: n[800],
        shadow: BUTTON_SHADOW.dark,
        ring: accent[500],
      }
    : {
        currentBackground: theme.colors.card,
        currentBorder: n[200],
        primary: theme.colors.text,
        secondary: n[500],
        tertiary: n[400],
        hover: n[200],
        shadow: BUTTON_SHADOW.light,
        ring: accent[500],
      };
}

const STYLE_ID = 'bloom-pagination-web-css';

// The `ring-2 ring-offset-2` on a page cell. The rules hang off a
// `dataSet` attribute (a class never reaches the DOM on a react-native-web
// primitive — see `chip/Chip.tsx`). No transition, deliberately (see above).
const PAGINATION_CSS = interactiveWebCss({
  selector: '[data-bloom-pagination-page]',
  varPrefix: 'bloom-pagination',
  base: `
    display: flex;
    box-sizing: border-box;
  `,
  transition: 'none',
  hover: { declarations: 'cursor: pointer;' },
  outlineOffset: 2,
});

const IS_WEB = Platform.OS === 'web';

interface PageCellProps {
  page: number;
  current: boolean;
  palette: PaginationPalette;
  label: string;
  onChange: (page: number) => void;
}

const PageCell = memo(function PageCell({ page, current, palette, label, onChange }: PageCellProps) {
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();

  const style: WebCssStyle = current
    ? {
        width: CELL,
        height: CELL,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: palette.currentBorder,
        backgroundColor: palette.currentBackground,
        boxShadow: palette.shadow,
        '--bloom-pagination-ring': palette.ring,
      }
    : {
        width: CELL,
        height: CELL,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hovered ? palette.hover : 'transparent',
        '--bloom-pagination-ring': palette.ring,
      };

  return (
    <View role="listitem">
      <Pressable
        {...(IS_WEB
          ? ({
              dataSet: { bloomPaginationPage: '' },
              'aria-current': current ? 'page' : undefined,
            } as Record<string, unknown>)
          : {})}
        role="button"
        accessibilityLabel={label}
        // `aria-current` (web, above) is the ARIA state for the current page;
        // `aria-selected` is invalid on `role="button"`. Native has neither, so
        // it announces `selected` — the one spelling React Native reads.
        accessibilityState={{ selected: current }}
        onPress={() => onChange(page)}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={style}
      >
        <Text
          variant="body-medium"
          style={{ color: current || hovered ? palette.primary : palette.secondary }}
        >
          {page}
        </Text>
      </Pressable>
    </View>
  );
});

const PaginationComponent: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  getPageLabel,
  accessibilityLabel = 'Pagination',
  style,
  testID,
}) => {
  const theme = useTheme();
  useInteractiveWebCss(STYLE_ID, PAGINATION_CSS);
  const palette = useMemo(() => resolvePaginationPalette(theme), [theme]);
  const [compact, setCompact] = useState(false);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setCompact(event.nativeEvent.layout.width < COMPACT_WIDTH);
  }, []);

  if (totalPages <= 1) return null;
  const pages = paginationRange(page, totalPages, compact ? 0 : siblingCount);

  return (
    <View
      role="navigation"
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      testID={testID}
      style={[
        {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        },
        style,
      ]}
    >
      <Button
        variant="secondary"
        size="small"
        iconOnly={compact}
        leadingIcon={ArrowLeft}
        accessibilityLabel={compact ? previousLabel : undefined}
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
      >
        {compact ? undefined : previousLabel}
      </Button>

      <View role="list" style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 0 }}>
        {pages.map((item, index) =>
          item === DOTS ? (
            <View
              key={`dots-${index}`}
              aria-hidden
              style={{ width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="body-medium" style={{ color: palette.tertiary }}>
                …
              </Text>
            </View>
          ) : (
            <PageCell
              key={item}
              page={item}
              current={item === page}
              palette={palette}
              label={getPageLabel ? getPageLabel(item) : `Go to page ${item}`}
              onChange={onChange}
            />
          ),
        )}
      </View>

      <Button
        variant="secondary"
        size="small"
        iconOnly={compact}
        leadingIcon={compact ? ArrowRight : undefined}
        trailingIcon={compact ? undefined : ArrowRight}
        accessibilityLabel={compact ? nextLabel : undefined}
        disabled={page >= totalPages}
        onPress={() => onChange(page + 1)}
      >
        {compact ? undefined : nextLabel}
      </Button>
    </View>
  );
};

export const Pagination = memo(PaginationComponent);
Pagination.displayName = 'Pagination';
