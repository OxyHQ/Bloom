/**
 * `LevelPicker` — WEB. The same control as `LevelPicker.tsx`, built out of the
 * three things a browser has and React Native does not, which is what makes
 * this a fork rather than a branch:
 *
 *  1. **Pointer capture.** `setPointerCapture` keeps the drag on the rail once
 *     the pointer leaves it, so a user can slam left or right past the end of
 *     the track and still be steering. Nothing in the RN responder system is
 *     equivalent on the platform where a pointer exists at all.
 *  2. **`inert` and a real focus model.** A collapsed region is `inert` — its
 *     rows leave the tab order and the accessibility tree together — and the
 *     rail is a focusable `role="slider"` with arrow, Home and End keys, which
 *     an `adjustable` on native exposes as increment/decrement ACTIONS instead.
 *  3. **`calc()`.** A stop's position is a percentage of the rail plus a pixel
 *     inset, which CSS resolves per frame; the native fork has to measure the
 *     rail with `onLayout` and multiply. Both read {@link levelStopPosition}, so
 *     the formula is one thing rendered two ways rather than two formulas.
 *
 * The rows themselves are NOT forked: the summary row is `floating/shared`'s
 * `MenuRowShell`, the same one the sub-menu triggers in the details region are
 * built from, so the disclosure and the rows it reveals cannot disagree about a
 * row's inset, highlight or height.
 */
import React, { useCallback, useRef, useState, type PointerEvent } from 'react';

import { PANEL_MOTION_DURATION, PANEL_MOTION_EASING, ROW_ICON_SIZE } from '../floating/constants';
import { cx, MenuRowChevron, MenuRowShell, SUB_TRIGGER_CLASS } from '../floating/shared';
import { useControllableState } from '../hooks/use-controllable-state';
import { useInteractionState } from '../hooks/use-interaction-state';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '../icons/Chevron';
import { flattenWebStyle } from '../styles/flatten-web-style';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import {
  LEVEL_CAPTION_CLASS,
  LEVEL_FILL_CLASS,
  LEVEL_ROW_INSET,
  LEVEL_SEPARATOR_CLASS,
  LEVEL_SLIDER_ROW_HEIGHT,
  LEVEL_STOP_CLASS,
  LEVEL_STOP_REACHED_CLASS,
  LEVEL_STOP_SIZE,
  LEVEL_THUMB_CLASS,
  LEVEL_THUMB_SIZE,
  LEVEL_TRACK_CLASS,
  LEVEL_TRACK_HEIGHT,
  levelFromOffset,
  levelStopPosition,
} from './constants';
import type { LevelPickerProps } from './types';

/**
 * The menu's own motion, as CSS. `FloatingPanel` runs its enter and exit on the
 * same duration and curve, so a picker changing shape inside a panel reads as
 * one surface moving rather than two things animating at each other.
 *
 * Spelled inline from the constants rather than as `duration-200 ease-out`
 * classes: a class would be a second copy of the number, free to drift from the
 * one the panel uses.
 */
const MOTION = {
  transitionDuration: `${PANEL_MOTION_DURATION}ms`,
  transitionTimingFunction: `cubic-bezier(${PANEL_MOTION_EASING.join(', ')})`,
} as const;

/** The rail's own chrome — everything about it that is not a colour role. */
const TRACK_CLASS =
  'w-full touch-none cursor-pointer outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover';

export function LevelPicker({
  levels,
  value,
  onValueChange,
  accessibilityLabel,
  minLabel,
  maxLabel,
  detailsLabel = 'Details',
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  children,
  className,
  style,
  testID,
}: LevelPickerProps) {
  const theme = useTheme();
  const [isExpanded, setExpanded] = useControllableState<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  const { state: pointerOver, onIn: enterPointer, onOut: leavePointer } = useInteractionState();
  const { state: focused, onIn: focusTrack, onOut: blurTrack } = useInteractionState();
  const [dragging, setDragging] = useState(false);
  const [detailsHeight, setDetailsHeight] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  /** The slider is being WORKED — hovered, focused or dragged. */
  const active = pointerOver || focused || dragging;

  /**
   * The details region's natural height, observed rather than read once: a
   * sub-menu row inside it can change size after the reveal has already run,
   * and a height measured only on mount would clip it.
   *
   * `ResizeObserver` is guarded because this fork also runs where there is no
   * layout to observe — an SSR pass, and jsdom under jest. There the region
   * falls back to its natural height (`maxHeight: undefined` below), which is
   * the safe direction: unclipped rather than collapsed.
   */
  const measureDetails = useCallback((node: HTMLDivElement | null) => {
    if (node === null) return;
    const read = (): void => {
      const next = node.offsetHeight;
      setDetailsHeight((prev) => (Math.abs(prev - next) > 0.5 ? next : prev));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const commitPointer = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (rect === undefined) return;
      const next = levelFromOffset(event.clientX - rect.left, rect.width, levels.length);
      if (next !== value) onValueChange(next);
    },
    [levels.length, onValueChange, value],
  );

  const step = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(levels.length - 1, to));
      if (next !== value) onValueChange(next);
    },
    [levels.length, onValueChange, value],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          event.preventDefault();
          step(value + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          event.preventDefault();
          step(value - 1);
          break;
        case 'Home':
          event.preventDefault();
          step(0);
          break;
        case 'End':
          event.preventDefault();
          step(levels.length - 1);
          break;
        default:
          break;
      }
    },
    [levels.length, step, value],
  );

  /** A stop's centre: a share of the rail, plus the inset that keeps the knob on it. */
  const positionOf = (index: number): string => {
    const { percent, offset } = levelStopPosition(index, levels.length);
    return `calc(${percent}% + ${offset}px)`;
  };

  const hasCaptions = minLabel !== undefined || maxLabel !== undefined;
  /**
   * The row's fade, on the ROW rather than on a wrapper around it: an inline
   * style outranks a class on web whatever the order, so this is the one place
   * the opacity can live without competing with `MenuRowShell`'s own chrome —
   * and it is one fewer node between the caller's layout and the row.
   *
   * `pointerEvents` follows the POINTER, not `active`, and the difference is not
   * a nicety. A rail keeps focus after it is clicked, so a row that stopped
   * taking clicks whenever `active` was true would be unclickable for as long as
   * the rail was focused — measured: the click falls through to the container,
   * which blurs the rail, and only the SECOND click reaches the row. Fading a
   * row the pointer is nowhere near is worth it; swallowing its click is not.
   */
  const pointerEngaged = pointerOver || dragging;
  const summaryStyle: WebCssStyle = {
    ...MOTION,
    transitionProperty: 'opacity',
    opacity: active ? 0 : 1,
    pointerEvents: pointerEngaged ? 'none' : 'auto',
  };
  const childTestId = (part: string): string | undefined =>
    testID === undefined ? undefined : `${testID}-${part}`;

  return (
    <div
      className={cx('flex w-full flex-col', className)}
      style={flattenWebStyle(style)}
      data-testid={testID}>
      {/* The rail, collapsing to nothing when the details take its place. */}
      <div
        inert={isExpanded}
        aria-hidden={isExpanded}
        className="overflow-hidden"
        style={{
          ...MOTION,
          transitionProperty: 'max-height, opacity',
          maxHeight: isExpanded ? 0 : LEVEL_SLIDER_ROW_HEIGHT,
          opacity: isExpanded ? 0 : 1,
        }}
        data-testid={childTestId('slider')}>
        <div
          className="flex items-center"
          style={{
            height: LEVEL_SLIDER_ROW_HEIGHT,
            paddingLeft: LEVEL_ROW_INSET,
            paddingRight: LEVEL_ROW_INSET,
          }}>
          <div
            ref={trackRef}
            role="slider"
            tabIndex={isExpanded ? -1 : 0}
            aria-label={accessibilityLabel}
            aria-valuemin={0}
            aria-valuemax={levels.length - 1}
            aria-valuenow={value}
            aria-valuetext={levels[value]}
            onPointerEnter={enterPointer}
            onPointerLeave={() => {
              if (!dragging) leavePointer();
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              enterPointer();
              commitPointer(event);
            }}
            onPointerMove={(event) => {
              if (dragging) commitPointer(event);
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              setDragging(false);
            }}
            onPointerCancel={() => setDragging(false)}
            onFocus={focusTrack}
            onBlur={blurTrack}
            onKeyDown={onKeyDown}
            className={cx(LEVEL_TRACK_CLASS, TRACK_CLASS)}
            style={{ height: LEVEL_TRACK_HEIGHT }}
            data-testid={childTestId('track')}>
            <span
              aria-hidden="true"
              className={LEVEL_FILL_CLASS}
              style={{ top: 0, bottom: 0, width: positionOf(value) }}
            />
            {levels.map((label, index) => (
              <span
                key={label}
                aria-hidden="true"
                className={index <= value ? LEVEL_STOP_REACHED_CLASS : LEVEL_STOP_CLASS}
                style={{
                  width: LEVEL_STOP_SIZE,
                  height: LEVEL_STOP_SIZE,
                  top: '50%',
                  left: positionOf(index),
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            <span
              aria-hidden="true"
              className={LEVEL_THUMB_CLASS}
              style={{
                width: LEVEL_THUMB_SIZE,
                height: LEVEL_THUMB_SIZE,
                top: '50%',
                left: positionOf(value),
                transform: 'translate(-50%, -50%)',
              }}
              data-testid={childTestId('thumb')}
            />
          </div>
        </div>
      </div>

      {/* The summary row, with the end captions riding over it: one is showing
          whenever the other is not. NOT `inert` while the captions are up —
          the row is only out of the POINTER's way, and a screen-reader user is
          not the one hovering the rail. */}
      <div className="relative">
        <MenuRowShell
          role="menuitem"
          expanded={isExpanded}
          disabled={false}
          title={detailsLabel}
          trailing={
            <MenuRowChevron>
              <span
                className="flex items-center justify-center"
                style={{
                  ...MOTION,
                  transitionProperty: 'transform',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                <ChevronRightIcon
                  width={ROW_ICON_SIZE}
                  height={ROW_ICON_SIZE}
                  fill={theme.colors.textSecondary}
                />
              </span>
            </MenuRowChevron>
          }
          onPress={() => setExpanded(!isExpanded)}
          className={SUB_TRIGGER_CLASS}
          style={summaryStyle}
          testID={childTestId('summary')}
        />
        {hasCaptions ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex flex-row items-center justify-between"
            style={{
              ...MOTION,
              transitionProperty: 'opacity',
              opacity: active ? 1 : 0,
              paddingLeft: LEVEL_ROW_INSET,
              paddingRight: LEVEL_ROW_INSET,
            }}
            data-testid={childTestId('captions')}>
            <span className={LEVEL_CAPTION_CLASS}>{minLabel}</span>
            <span className={LEVEL_CAPTION_CLASS}>{maxLabel}</span>
          </div>
        ) : null}
      </div>

      {/* The details. `inert` while collapsed, so a sub-menu row inside a
          zero-height clip is not still tabbable. */}
      <div
        inert={!isExpanded}
        aria-hidden={!isExpanded}
        className="overflow-hidden"
        style={{
          ...MOTION,
          transitionProperty: 'max-height, opacity',
          maxHeight: isExpanded ? (detailsHeight === 0 ? undefined : detailsHeight) : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        data-testid={childTestId('details')}>
        <div ref={measureDetails}>
          <div
            className={LEVEL_SEPARATOR_CLASS}
            style={{
              marginLeft: LEVEL_ROW_INSET,
              marginRight: LEVEL_ROW_INSET,
              marginBottom: 4,
            }}
          />
          {children}
        </div>
      </div>
    </div>
  );
}

LevelPicker.displayName = 'LevelPicker';
