import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Pressable, View } from 'react-native';

import { Button } from '../button';
import { mixColor, resolveButtonRamps } from '../button/shared';
import { webDataSet } from '../styles/web-data';
import { resolveMenuPalette } from '../floating/menu-palette';
import { useInteractionState } from '../hooks/use-interaction-state';
import { RiArrowLeftSLine } from '../icons/remix/RiArrowLeftSLine';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiImageAddLine } from '../icons/remix/RiImageAddLine';
import { useImageResolver } from '../image-resolver/context';
import { resolvePhoto } from '../listing-card/shared';
import { Loading } from '../loading';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { focusRingShadow } from '../styles/interactive-web-css';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { moveItem } from '../hooks/list-reorder';
import { slotAtPoint, sortableGridColumns } from './reorder';
import type { SortablePhoto, SortablePhotoGridLabels, SortablePhotoGridProps } from './types';

/**
 * An editable, reorderable grid of uploaded photos. The first photo is the
 * cover.
 *
 *   grid      3 columns below 640 wide, 4 from there (or `columns`); square
 *             tiles, 12 apart (8 below 480)
 *   tile      radius 12, placeholder neutral-100 (dark neutral-800) behind the
 *             photo, which covers the tile
 *   cover     the first tile's top-left pill: the floating surface,
 *             caption-1-semibold, 24 tall, full pill
 *   controls  small secondary icon `Button`s (32): remove top-right, move
 *             earlier bottom-left, move later bottom-right. On a web pointer
 *             that can hover they appear while the tile is hovered or holds
 *             focus; on touch and native they are always shown.
 *   uploading a neutral-950 scrim at 50%, the percentage (caption-1-semibold)
 *             over a 4-tall bar 60% of the tile wide, both neutral-50; no
 *             `progress` draws a spinner instead
 *   error     the same scrim, a warning glyph, the error line and a Retry
 *             button when `onRetry` is given
 *   add       a dashed 1.5px neutral-300 (dark neutral-600) tile with the
 *             add-photo glyph and "Add photos"; hover fills neutral-50 (dark
 *             neutral-900)
 *
 * Reordering: on web a mouse or pen drags a tile (5px of travel starts the
 * drag); the other tiles make room live, a lifted copy follows the pointer,
 * and Escape cancels. Touch and native reorder with the move buttons, which is
 * also the keyboard and screen-reader path — after a move, focus stays on the
 * moved photo's button and the new position is announced politely.
 *
 * Colour-only hover; no scale.
 */

const IS_WEB = Platform.OS === 'web';
const RADIUS = 12;
const DRAG_THRESHOLD = 5;

const DEFAULT_LABELS: SortablePhotoGridLabels = {
  photo: (position, total) => `Photo ${position} of ${total}`,
  cover: 'Cover',
  moveEarlier: (position) => `Move photo ${position} earlier`,
  moveLater: (position) => `Move photo ${position} later`,
  remove: (position) => `Remove photo ${position}`,
  retry: (position) => `Retry uploading photo ${position}`,
  retryAction: 'Retry',
  uploading: (position) => `Uploading photo ${position}`,
  failed: 'Upload failed',
  add: 'Add photos',
  moved: (position, total) => `Moved to position ${position} of ${total}`,
};

const STYLE_ID = 'bloom-sortable-photo-grid-web-css';
const GRID = '[data-bloom-sortable-grid]';
const TILE = '[data-bloom-sortable-tile]';
const CONTROLS = '[data-bloom-sortable-controls]';
const ADD = '[data-bloom-sortable-add]';
const CSS = `
${GRID}[data-bloom-sortable-grid="enabled"] ${TILE} {
  cursor: grab;
}
${GRID}[data-bloom-sortable-grid="dragging"],
${GRID}[data-bloom-sortable-grid="dragging"] ${TILE} {
  cursor: grabbing;
}
${TILE} {
  user-select: none;
  -webkit-user-select: none;
}
${TILE} img {
  -webkit-user-drag: none;
  user-drag: none;
}
${CONTROLS} {
  transition: opacity 150ms ease-out;
}
@media (any-hover: hover) {
  ${CONTROLS} {
    opacity: 0;
  }
  ${TILE}:hover ${CONTROLS}, ${TILE}:focus-within ${CONTROLS} {
    opacity: 1;
  }
  ${GRID}[data-bloom-sortable-grid="dragging"] ${CONTROLS} {
    opacity: 0;
  }
}
${ADD} {
  outline: none;
  cursor: pointer;
}
${ADD}[aria-disabled="true"] {
  cursor: default;
}
${ADD}:focus-visible {
  box-shadow: ${focusRingShadow('--bloom-sortable-ring')};
}
@media (prefers-reduced-motion: reduce) {
  ${CONTROLS} {
    transition: none;
  }
}
`;

interface GridPaint {
  placeholder: string;
  scrim: string;
  onMedia: string;
  surface: string;
  surfaceText: string;
  surfaceShadow: string;
  addBorder: string;
  addHover: string;
  addIcon: string;
  text: string;
  textSecondary: string;
  slotBorder: string;
  ring: string;
}

function resolveGridPaint(theme: Theme): GridPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const menu = resolveMenuPalette(theme);
  const dark = theme.isDark;
  return {
    placeholder: dark ? mixColor(n[800], n[700], 0.6) : n[100],
    scrim: n[950],
    onMedia: n[50],
    surface: menu.surface,
    surfaceText: menu.text,
    surfaceShadow: menu.shadow,
    addBorder: dark ? n[600] : n[300],
    addHover: dark ? n[900] : n[50],
    addIcon: theme.colors.textSecondary,
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    slotBorder: dark ? n[600] : n[300],
    ring: accent[500],
  };
}

interface DragState {
  id: string;
  from: number;
  over: number;
  /** The lifted copy's top-left, relative to the grid. */
  x: number;
  y: number;
}

interface PendingDrag {
  id: string;
  from: number;
  over: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
}

type MoveDirection = 'earlier' | 'later';

function SortablePhotoGridComponent({
  photos,
  onReorder,
  onRemove,
  onRetry,
  onAdd,
  maxPhotos,
  addHint,
  columns: columnsProp,
  photoVariant,
  disabled = false,
  labels: labelsProp,
  accessibilityLabel = 'Photos',
  style,
  testID,
}: SortablePhotoGridProps) {
  const theme = useTheme();
  const ringOffset = useRingOffsetStyle();
  const resolver = useImageResolver();
  const paint = useMemo(() => resolveGridPaint(theme), [theme]);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp]);
  useEffect(() => {
    if (IS_WEB) adoptStyleSheet(STYLE_ID, CSS);
  }, []);

  const [width, setWidth] = useState(0);
  const columns = columnsProp ?? sortableGridColumns(width);
  const gap = width > 0 && width < 480 ? 8 : 12;
  const cell = width > 0 ? Math.floor((width - gap * (columns - 1)) / columns) : 0;

  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const gridRef = useRef<View>(null);
  const pendingFocus = useRef<{ id: string; direction: MoveDirection } | null>(null);

  const latest = useRef({ photos, columns, cell, gap, disabled, onReorder, labels });
  latest.current = { photos, columns, cell, gap, disabled, onReorder, labels };

  // ---------------------------------------------------------------------------
  //  Web drag: pointer events on the grid element, window listeners while held.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!IS_WEB) return undefined;
    const element = gridRef.current as unknown as HTMLElement | null;
    if (!element || typeof element.addEventListener !== 'function') return undefined;
    let pending: PendingDrag | null = null;

    const finish = (commit: boolean) => {
      const current = pending;
      pending = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey, true);
      if (!current?.active) return;
      setDrag(null);
      const state = latest.current;
      if (commit && current.over !== current.from) {
        state.onReorder(moveItem(state.photos, current.from, current.over));
        setAnnouncement(state.labels.moved(current.over + 1, state.photos.length));
      }
    };

    const onMove = (event: PointerEvent) => {
      const current = pending;
      if (!current) return;
      if (!current.active) {
        const travel = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
        if (travel < DRAG_THRESHOLD) return;
        current.active = true;
      }
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const state = latest.current;
      current.over = slotAtPoint(x, y, {
        columns: state.columns,
        cellWidth: state.cell,
        cellHeight: state.cell,
        gap: state.gap,
        count: state.photos.length,
      });
      setDrag({ id: current.id, from: current.from, over: current.over, x: x - current.offsetX, y: y - current.offsetY });
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pending?.active) {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const state = latest.current;
      if (state.disabled || event.button !== 0 || event.pointerType === 'touch') return;
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;
      if (target.closest('button, a, input, [role="button"]')) return;
      const tile = target.closest(TILE) as HTMLElement | null;
      if (!tile || !element.contains(tile)) return;
      const id = tile.getAttribute('data-bloom-sortable-tile');
      const from = state.photos.findIndex((photo) => photo.id === id);
      if (id == null || from < 0 || state.photos.length < 2) return;
      event.preventDefault();
      const tileRect = tile.getBoundingClientRect();
      pending = {
        id,
        from,
        over: from,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - tileRect.left,
        offsetY: event.clientY - tileRect.top,
        active: false,
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey, true);
    };

    element.addEventListener('pointerdown', onPointerDown);
    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      finish(false);
    };
  }, []);

  // ---------------------------------------------------------------------------
  //  Move buttons
  // ---------------------------------------------------------------------------
  const move = useCallback(
    (id: string, direction: MoveDirection) => {
      const from = photos.findIndex((photo) => photo.id === id);
      if (from < 0) return;
      const to = direction === 'earlier' ? from - 1 : from + 1;
      if (to < 0 || to >= photos.length) return;
      pendingFocus.current = { id, direction };
      onReorder(moveItem(photos, from, to));
      setAnnouncement(labels.moved(to + 1, photos.length));
    },
    [photos, onReorder, labels],
  );

  // Keep focus on the moved photo's button: the tile has moved in the DOM, and a
  // button that reached the end of the list is now disabled.
  useLayoutEffect(() => {
    const request = pendingFocus.current;
    if (!IS_WEB || !request) return;
    pendingFocus.current = null;
    const element = gridRef.current as unknown as HTMLElement | null;
    if (!element || typeof element.querySelector !== 'function') return;
    const find = (direction: MoveDirection) =>
      element.querySelector<HTMLButtonElement>(
        `[data-bloom-sortable-move="${request.id}:${direction}"] button:not([disabled])`,
      );
    const other: MoveDirection = request.direction === 'earlier' ? 'later' : 'earlier';
    (find(request.direction) ?? find(other))?.focus();
  }, [photos]);

  const shown = drag ? moveItem(photos, drag.from, drag.over) : photos;
  const total = photos.length;
  const canAdd = !!onAdd && (maxPhotos === undefined || total < maxPhotos);
  const dragged = drag ? photos.find((photo) => photo.id === drag.id) : undefined;

  const gridState = drag ? 'dragging' : disabled || total < 2 ? 'static' : 'enabled';

  return (
    <View
      testID={testID}
      style={style}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View
        ref={gridRef}
        role="list"
        accessibilityLabel={accessibilityLabel}
        {...webDataSet({ bloomSortableGrid: gridState })}
        testID={testID ? `${testID}-grid` : undefined}
        style={{ position: 'relative', flexDirection: 'row', flexWrap: 'wrap', gap }}
      >
        {cell > 0
          ? shown.map((photo, index) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                position={index + 1}
                total={total}
                size={cell}
                paint={paint}
                labels={labels}
                resolvedUri={resolvePhoto(photo.uri, resolver, photoVariant)}
                slot={drag?.id === photo.id}
                disabled={disabled}
                onMove={move}
                onRemove={onRemove}
                onRetry={onRetry}
                testID={testID ? `${testID}-photo-${photo.id}` : undefined}
              />
            ))
          : null}
        {cell > 0 && canAdd ? (
          <AddTile
            size={cell}
            paint={paint}
            label={labels.add}
            hint={addHint}
            disabled={disabled}
            onPress={onAdd}
            testID={testID ? `${testID}-add` : undefined}
          />
        ) : null}
        {drag && dragged ? (
          <View
            pointerEvents="none"
            aria-hidden
            testID={testID ? `${testID}-lifted` : undefined}
            style={
              {
                position: 'absolute',
                left: drag.x,
                top: drag.y,
                width: cell,
                height: cell,
                borderRadius: RADIUS,
                overflow: 'hidden',
                backgroundColor: paint.placeholder,
                boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
                zIndex: 2,
              } satisfies WebCssStyle
            }
          >
            <Image
              source={{ uri: resolvePhoto(dragged.uri, resolver, photoVariant) }}
              style={{ width: cell, height: cell }}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
        testID={testID ? `${testID}-status` : undefined}
      >
        {announcement}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Tiles
// ---------------------------------------------------------------------------

interface PhotoTileProps {
  photo: SortablePhoto;
  position: number;
  total: number;
  size: number;
  paint: GridPaint;
  labels: SortablePhotoGridLabels;
  resolvedUri: string | undefined;
  /** The dragged photo's slot: drawn as an empty outline. */
  slot: boolean;
  disabled: boolean;
  onMove: (id: string, direction: MoveDirection) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  testID?: string;
}

const PhotoTile = memo(function PhotoTile({
  photo,
  position,
  total,
  size,
  paint,
  labels,
  resolvedUri,
  slot,
  disabled,
  onMove,
  onRemove,
  onRetry,
  testID,
}: PhotoTileProps) {
  const cover = position === 1;
  const status = photo.status ?? 'uploaded';
  const nameParts = [labels.photo(position, total)];
  if (cover) nameParts.push(labels.cover);
  if (photo.alt) nameParts.push(photo.alt);
  if (status === 'error') nameParts.push(photo.error ?? labels.failed);
  const name = nameParts.join(', ');
  const showControls = !slot && !disabled;

  return (
    <View
      role="listitem"
      accessibilityLabel={name}
      {...webDataSet({ bloomSortableTile: photo.id })}
      testID={testID}
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS,
        overflow: 'hidden',
        backgroundColor: slot ? 'transparent' : paint.placeholder,
        borderWidth: slot ? 1.5 : 0,
        borderStyle: 'dashed',
        borderColor: paint.slotBorder,
      }}
    >
      {slot ? null : (
        <>
          {resolvedUri ? (
            <Image
              source={{ uri: resolvedUri }}
              accessibilityIgnoresInvertColors
              style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }}
              resizeMode="cover"
            />
          ) : null}

          {status === 'uploading' ? (
            <UploadOverlay photo={photo} position={position} paint={paint} labels={labels} testID={testID} />
          ) : null}
          {status === 'error' ? (
            <ErrorOverlay
              photo={photo}
              position={position}
              size={size}
              paint={paint}
              labels={labels}
              onRetry={onRetry && !disabled ? () => onRetry(photo.id) : undefined}
              testID={testID}
            />
          ) : null}

          {cover ? (
            <View
              pointerEvents="none"
              testID={testID ? `${testID}-cover` : undefined}
              style={
                {
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  height: 24,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 999,
                  justifyContent: 'center',
                  backgroundColor: paint.surface,
                  boxShadow: paint.surfaceShadow,
                } satisfies WebCssStyle
              }
            >
              <Text variant="caption-1-semibold" numberOfLines={1} style={{ color: paint.surfaceText }}>
                {labels.cover}
              </Text>
            </View>
          ) : null}

          {showControls ? (
            <View
              pointerEvents="box-none"
              {...webDataSet({ bloomSortableControls: '' })}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            >
              {onRemove ? (
                <View style={{ position: 'absolute', top: 6, right: 6 }}>
                  <Button
                    variant="secondary"
                    size="small"
                    iconOnly
                    leadingIcon={RiCloseLine}
                    accessibilityLabel={labels.remove(position)}
                    onPress={() => onRemove(photo.id)}
                    testID={testID ? `${testID}-remove` : undefined}
                  />
                </View>
              ) : null}
              {total > 1 ? (
                <>
                  <View
                    {...webDataSet({ bloomSortableMove: `${photo.id}:earlier` })}
                    style={{ position: 'absolute', bottom: 6, left: 6 }}
                  >
                    <Button
                      variant="secondary"
                      size="small"
                      iconOnly
                      leadingIcon={RiArrowLeftSLine}
                      accessibilityLabel={labels.moveEarlier(position)}
                      disabled={position === 1}
                      onPress={() => onMove(photo.id, 'earlier')}
                      testID={testID ? `${testID}-earlier` : undefined}
                    />
                  </View>
                  <View
                    {...webDataSet({ bloomSortableMove: `${photo.id}:later` })}
                    style={{ position: 'absolute', bottom: 6, right: 6 }}
                  >
                    <Button
                      variant="secondary"
                      size="small"
                      iconOnly
                      leadingIcon={RiArrowRightSLine}
                      accessibilityLabel={labels.moveLater(position)}
                      disabled={position === total}
                      onPress={() => onMove(photo.id, 'later')}
                      testID={testID ? `${testID}-later` : undefined}
                    />
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
});

function Scrim({ paint }: { paint: GridPaint }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: paint.scrim, opacity: 0.5 }}
    />
  );
}

function UploadOverlay({
  photo,
  position,
  paint,
  labels,
  testID,
}: {
  photo: SortablePhoto;
  position: number;
  paint: GridPaint;
  labels: SortablePhotoGridLabels;
  testID?: string;
}) {
  const progress = photo.progress == null ? undefined : Math.min(100, Math.max(0, Math.round(photo.progress)));
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
    >
      <Scrim paint={paint} />
      <View
        role="progressbar"
        accessibilityLabel={labels.uploading(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-busy
        testID={testID ? `${testID}-progress` : undefined}
        style={{ width: '60%', alignItems: 'center', gap: 6 }}
      >
        {progress === undefined ? (
          <Loading variant="spinner" size="small" color={paint.onMedia} />
        ) : (
          <>
            <Text variant="caption-1-semibold" style={{ color: paint.onMedia, fontVariant: ['tabular-nums'] }}>
              {`${progress}%`}
            </Text>
            <View style={{ alignSelf: 'stretch', height: 4, borderRadius: 2, overflow: 'hidden' }}>
              <View
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: paint.onMedia, opacity: 0.3 }}
              />
              <View style={{ width: `${progress}%`, height: 4, backgroundColor: paint.onMedia }} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function ErrorOverlay({
  photo,
  position,
  size,
  paint,
  labels,
  onRetry,
  testID,
}: {
  photo: SortablePhoto;
  position: number;
  size: number;
  paint: GridPaint;
  labels: SortablePhotoGridLabels;
  onRetry?: () => void;
  testID?: string;
}) {
  const compact = size < 120;
  return (
    <View
      pointerEvents="box-none"
      testID={testID ? `${testID}-error` : undefined}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      <Scrim paint={paint} />
      <RiErrorWarningLine width={20} height={20} fill={paint.onMedia} />
      {compact ? null : (
        <Text variant="caption-1-medium" numberOfLines={2} style={{ color: paint.onMedia, textAlign: 'center' }}>
          {photo.error ?? labels.failed}
        </Text>
      )}
      {onRetry ? (
        <Button
          variant="secondary"
          size="xs"
          onPress={onRetry}
          accessibilityLabel={labels.retry(position)}
          testID={testID ? `${testID}-retry` : undefined}
        >
          {labels.retryAction}
        </Button>
      ) : null}
    </View>
  );
}

function AddTile({
  size,
  paint,
  label,
  hint,
  disabled,
  onPress,
  testID,
}: {
  size: number;
  paint: GridPaint;
  label: string;
  hint?: string;
  disabled: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const ringOffset = useRingOffsetStyle();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const { state: pressed, onIn: onPressIn, onOut: onPressOut } = useInteractionState();
  const active = !disabled && (hovered || pressed);
  const compact = size < 120;

  const tileStyle: WebCssStyle = {
    width: size,
    height: size,
    borderRadius: RADIUS,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: paint.addBorder,
    backgroundColor: active ? paint.addHover : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 8,
    opacity: disabled ? 0.5 : 1,
    '--bloom-sortable-ring': paint.ring,
    ...ringOffset,
  };

  return (
    <Pressable
      role="button"
      accessibilityLabel={hint ? `${label}, ${hint}` : label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      {...webDataSet({ bloomSortableAdd: '' })}
      testID={testID}
      style={tileStyle}
    >
      <RiImageAddLine width={24} height={24} fill={paint.addIcon} />
      <Text variant="body-2-medium" numberOfLines={2} style={{ color: paint.text, textAlign: 'center' }}>
        {label}
      </Text>
      {hint && !compact ? (
        <Text variant="caption-1-regular" numberOfLines={2} style={{ color: paint.textSecondary, textAlign: 'center' }}>
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

export const SortablePhotoGrid = memo(SortablePhotoGridComponent);
SortablePhotoGrid.displayName = 'SortablePhotoGrid';
