import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Button } from '../button';
import { Surface } from '../surface';
import { Text } from '../typography';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { pointerEventsStyles } from '../styles/pointer-events';
import { StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { CoverImage } from './CoverImage';
import { CENTER_POSITION, clampPosition, dragCoverPosition, coverSourceIdentity } from './geometry';
import { COVER_HEADER_MESSAGES } from './messages';
import type { CoverHeaderProps, CoverImageGeometry, CoverPosition } from './types';

/** A cover band with content overlapping its bottom edge through normal flow. */
function CoverHeaderComponent({
  coverSource,
  coverSourceKey,
  coverPosition = CENTER_POSITION,
  coverFit = 'cover',
  cover,
  coverHeight = 170,
  overlap = 45,
  coverStyle,
  contentStyle,
  children,
  style,
  testID,
  repositionable = false,
  repositionAxes = 'both',
  onCoverPositionCommit,
  onCoverPositionChange,
  actions,
  labels,
}: CoverHeaderProps) {
  const theme = useTheme();
  const common = useCommonMessages();
  const { messages } = useMessages(COVER_HEADER_MESSAGES);
  const m = { ...messages, save: common.save, cancel: common.cancel, ...labels };
  const rise = Math.min(Math.max(overlap, 0), coverHeight);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState(() => clampPosition(coverPosition));
  const [geometry, setGeometry] = useState<CoverImageGeometry | null>(null);
  const editHost = useRef<ComponentRef<typeof View>>(null);
  const revision = useRef(0);
  const pendingRef = useRef(false);
  const dragStart = useRef(draft);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const enabled =
    repositionable &&
    !!coverSource &&
    cover == null &&
    coverFit === 'cover' &&
    !!onCoverPositionCommit;
  const sourceKey = coverSourceIdentity(coverSource, coverSourceKey);
  const canMove =
    !!geometry && (geometry.overflowY > 0 || (repositionAxes === 'both' && geometry.overflowX > 0));

  // Changing image/permissions invalidates any in-flight save and discards its draft.
  useEffect(() => {
    revision.current += 1;
    setEditing(false);
    setPending(false);
    pendingRef.current = false;
    setFailed(false);
    return () => {
      revision.current += 1;
    };
  }, [sourceKey, enabled]);
  useEffect(() => {
    if (editing && Platform.OS === 'web') editHost.current?.focus();
  }, [editing]);

  const updateDraft = useCallback(
    (next: CoverPosition) => {
      draftRef.current = next;
      setDraft(next);
      setFailed(false);
      onCoverPositionChange?.(next);
    },
    [onCoverPositionChange],
  );
  const cancel = () => {
    if (pendingRef.current) return;
    revision.current += 1;
    setEditing(false);
    setFailed(false);
    onCoverPositionChange?.(clampPosition(coverPosition));
  };
  const save = async () => {
    if (pendingRef.current || !onCoverPositionCommit) return;
    const current = revision.current;
    pendingRef.current = true;
    setPending(true);
    setFailed(false);
    try {
      await onCoverPositionCommit(draftRef.current);
      if (revision.current === current) setEditing(false);
    } catch {
      if (revision.current === current) setFailed(true);
    } finally {
      if (revision.current === current) {
        pendingRef.current = false;
        setPending(false);
      }
    }
  };
  const move = (x: number, y: number) => {
    if (!geometry || pendingRef.current) return;
    updateDraft(dragCoverPosition(draftRef.current, { x, y }, geometry, repositionAxes));
  };
  const callbacks = useRef({ editing, pending, geometry, repositionAxes, updateDraft });
  callbacks.current = { editing, pending, geometry, repositionAxes, updateDraft };
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(editing && !pending && canMove)
        .minDistance(1)
        .runOnJS(true)
        .onBegin(() => {
          dragStart.current = draftRef.current;
        })
        .onUpdate((event) => {
          const current = callbacks.current;
          if (current.geometry && current.editing && !current.pending) {
            current.updateDraft(
              dragCoverPosition(
                dragStart.current,
                { x: event.translationX, y: event.translationY },
                current.geometry,
                current.repositionAxes,
              ),
            );
          }
        }),
    [editing, pending, canMove],
  );
  const webProps: Pick<ViewProps, 'tabIndex' | 'onKeyDown'> =
    Platform.OS === 'web'
      ? {
          tabIndex: editing ? 0 : -1,
          onKeyDown: (event) => {
            if (!editing || pendingRef.current) return;
            const amount = event.nativeEvent.shiftKey ? 40 : 10;
            switch (event.nativeEvent.key) {
              case 'ArrowUp':
                event.preventDefault();
                move(0, -amount);
                break;
              case 'ArrowDown':
                event.preventDefault();
                move(0, amount);
                break;
              case 'ArrowLeft':
                event.preventDefault();
                move(-amount, 0);
                break;
              case 'ArrowRight':
                event.preventDefault();
                move(amount, 0);
                break;
              case 'Home':
              case 'End': {
                event.preventDefault();
                const edge = event.nativeEvent.key === 'Home' ? 0 : 1;
                updateDraft({
                  x: repositionAxes === 'both' && geometry?.overflowX ? edge : draftRef.current.x,
                  y: geometry?.overflowY ? edge : draftRef.current.y,
                });
                break;
              }
              case 'Escape':
                event.preventDefault();
                cancel();
                break;
              case 'Enter':
                event.preventDefault();
                void save();
                break;
            }
          },
        }
      : {};

  return (
    <View testID={testID} style={[{ position: 'relative', width: '100%' }, style]}>
      <View
        testID={testID ? `${testID}-cover` : undefined}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: coverHeight,
            overflow: 'hidden',
            backgroundColor: theme.colors.backgroundTertiary,
          },
          coverStyle,
        ]}
      >
        <GestureDetector gesture={gesture} touchAction={editing ? 'none' : 'auto'}>
          <StyledView
            ref={editHost}
            collapsable={false}
            {...webProps}
            testID={testID ? `${testID}-position-editor` : undefined}
            accessible={editing}
            accessibilityRole={
              Platform.OS === 'web' ? undefined : editing ? 'adjustable' : undefined
            }
            accessibilityLabel={editing ? m.instruction : undefined}
            aria-valuemin={Platform.OS !== 'web' && editing ? 0 : undefined}
            aria-valuemax={Platform.OS !== 'web' && editing ? 100 : undefined}
            aria-valuenow={Platform.OS !== 'web' && editing ? Math.round(draft.y * 100) : undefined}
            accessibilityActions={
              editing
                ? [
                    { name: 'increment', label: m.moveUp },
                    { name: 'decrement', label: m.moveDown },
                    ...(repositionAxes === 'both'
                      ? [
                          { name: 'moveLeft', label: m.moveLeft },
                          { name: 'moveRight', label: m.moveRight },
                        ]
                      : []),
                  ]
                : undefined
            }
            onAccessibilityAction={(event) => {
              if (!editing) return;
              switch (event.nativeEvent.actionName) {
                case 'increment':
                  move(0, -10);
                  break;
                case 'decrement':
                  move(0, 10);
                  break;
                case 'moveLeft':
                  move(-10, 0);
                  break;
                case 'moveRight':
                  move(10, 0);
                  break;
              }
            }}
            style={StyleSheet.absoluteFill}
          >
            {cover ??
              (coverSource ? (
                <CoverImage
                  source={coverSource}
                  sourceKey={coverSourceKey}
                  position={editing ? draft : coverPosition}
                  contentFit={coverFit}
                  onGeometryChange={setGeometry}
                  testID={testID ? `${testID}-cover-image` : undefined}
                />
              ) : null)}
          </StyledView>
        </GestureDetector>
      </View>
      <View
        testID={testID ? `${testID}-content` : undefined}
        style={[
          { position: 'relative', width: '100%' },
          pointerEventsStyles['box-none'],
          contentStyle,
          { paddingTop: coverHeight - rise },
        ]}
      >
        {children}
      </View>
      {editing || actions || enabled ? (
        <View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, height: coverHeight },
            pointerEventsStyles['box-none'],
            { justifyContent: 'flex-end', alignItems: 'flex-end', padding: 12 },
          ]}
        >
          <Surface radius={12} style={{ padding: 4, gap: 4, maxWidth: '100%' }}>
            {editing && failed ? (
              <Text accessibilityRole="alert" style={{ paddingHorizontal: 8 }}>
                {m.saveError}
              </Text>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 4,
              }}
            >
              {editing ? (
                <>
                  <Button appearance="subtle" tone="neutral" disabled={pending} onPress={cancel}>
                    {m.cancel}
                  </Button>
                  <Button
                    loading={pending}
                    onPress={() => {
                      void save();
                    }}
                  >
                    {m.save}
                  </Button>
                </>
              ) : (
                <>
                  {actions}
                  {enabled ? (
                    <Button
                      appearance="subtle"
                      tone="neutral"
                      disabled={!canMove}
                      onPress={() => {
                        if (!canMove) return;
                        revision.current += 1;
                        setDraft(clampPosition(coverPosition));
                        setFailed(false);
                        setEditing(true);
                      }}
                    >
                      {m.reposition}
                    </Button>
                  ) : null}
                </>
              )}
            </View>
          </Surface>
        </View>
      ) : null}
    </View>
  );
}
export const CoverHeader = memo(CoverHeaderComponent);
CoverHeader.displayName = 'CoverHeader';
