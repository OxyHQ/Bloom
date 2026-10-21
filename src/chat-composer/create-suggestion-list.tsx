import type React from 'react';
import { useEffect, useId, useRef } from 'react';
import { View, type ScrollView } from 'react-native';
import { ScrollArea } from '../layout/ScrollArea';
import { BloomScope } from '../appearance';
import { useSurfaceFill } from '../styles/surface-levels';
import type { Surface as SurfaceComponent } from '../surface';
import type { Loading as LoadingComponent } from '../loading';
import { RiHashtag } from '../icons/remix/RiHashtag';
import { RiVerifiedBadgeFill } from '../icons/remix/RiVerifiedBadgeFill';
import { useImageResolver } from '../image-resolver/context';
import { useMessages } from '../locale/messages';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { MenuRowShell } from '../floating/shared';
import { useMenuDensity } from '../floating/use-menu-density';
import { useMenuPalette } from '../floating/menu-palette';
import { menuType } from '../floating/menu-type';
import {
  PANEL_RADIUS,
  SUGGESTION_MAX_HEIGHT,
  SUGGESTION_ANCHORED_MAX_HEIGHT,
  resolveChatComposerPalette,
} from './shared';
import { CHAT_COMPOSER_MESSAGES } from './messages';
import type { ChatComposerSuggestion, SuggestionKind, SuggestionListProps } from './types';
import type { SuggestionPanelProps } from './suggestion-panel-types';
import { suggestionOptionId } from './suggestion-option-id';
import { IS_WEB } from '../styles/platform';
import { BloomImage } from '../image';

/** Both presentations share rows and input-owned selection; only their scroll/surface owner differs. */
export function createSuggestionList({
  Surface,
  Loading,
  SuggestionPanel,
}: {
  Surface: typeof SurfaceComponent;
  Loading: typeof LoadingComponent;
  SuggestionPanel: React.ComponentType<SuggestionPanelProps>;
}) {
  function isUrl(value: string): boolean {
    return /^(https?:)?\/\//.test(value) || value.startsWith('data:') || value.startsWith('file:');
  }

  function Leading({
    kind,
    suggestion,
    size,
  }: {
    kind: SuggestionKind;
    suggestion: ChatComposerSuggestion;
    size: number;
  }) {
    const theme = useTheme();
    const palette = resolveChatComposerPalette(theme, useSurfaceFill());
    const resolveImage = useImageResolver();

    if (kind === 'emoji') {
      return (
        <Text variant="title-2-regular" style={{ width: size, textAlign: 'center' }}>
          {suggestion.emoji ?? suggestion.label}
        </Text>
      );
    }
    if (kind === 'mention') {
      const uri =
        suggestion.avatar === undefined
          ? undefined
          : isUrl(suggestion.avatar)
            ? suggestion.avatar
            : resolveImage?.(suggestion.avatar, 'thumb');
      return uri ? (
        <BloomImage
          source={{ uri }}
          accessibilityIgnoresInvertColors
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.inset,
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.inset,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="body-2-medium" style={{ color: palette.textSecondary }}>
            {suggestion.label.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      );
    }
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: palette.inset,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RiHashtag width={16} height={16} fill={palette.iconSecondary} />
      </View>
    );
  }

  function SuggestionList({ size, ...props }: SuggestionListProps) {
    return (
      <BloomScope size={size}>
        <SuggestionBody {...props} />
      </BloomScope>
    );
  }

  function SuggestionBody({
    kind,
    suggestions,
    activeIndex = -1,
    onSelectSuggestion,
    onActiveIndexChange,
    header,
    maxHeight,
    style,
    testID,
    accessibilityLabel,
    loading = false,
    showEmpty = false,
    emptyLabel,
    loadingLabel,
    anchor,
    open = true,
    onOpenChange,
    listboxId: suppliedId,
  }: SuggestionListProps) {
    const generatedId = useId();
    const listboxId = suppliedId ?? `bloom-suggestions-${generatedId}`;
    const { messages } = useMessages(CHAT_COMPOSER_MESSAGES);
    const palette = useMenuPalette();
    const density = useMenuDensity();
    const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
    const rowPositions = useRef(new Map<number, number>());
    const lastPointer = useRef<{ x: number; y: number } | null>(null);
    const active = suggestions[activeIndex];
    const activeId = active ? suggestionOptionId(listboxId, active.id) : undefined;
    const label = accessibilityLabel ?? messages.suggestions[kind];
    const empty = !loading && suggestions.length === 0;
    // Reveal only inside OUR viewport. scrollIntoView would move the document
    // and change the caret's anchor while the user is navigating its results.
    useEffect(() => {
      if (!open || !activeId) return;
      const frame = requestAnimationFrame(() => {
        if (IS_WEB && typeof document !== 'undefined') {
          const option = document.getElementById(activeId);
          const scroller = (
            scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement }
          )?.getScrollableNode?.();
          if (!option || !scroller) return;
          const row = option.getBoundingClientRect();
          const viewport = scroller.getBoundingClientRect();
          if (row.top < viewport.top) scroller.scrollTop += row.top - viewport.top;
          else if (row.bottom > viewport.bottom) scroller.scrollTop += row.bottom - viewport.bottom;
        } else {
          const y = rowPositions.current.get(activeIndex);
          if (y !== undefined) scrollRef.current?.scrollTo({ y, animated: false });
        }
      });
      return () => cancelAnimationFrame(frame);
    }, [activeId, activeIndex, open, suggestions]);

    if (!open || (empty && !showEmpty)) return null;
    const body = (
      <View style={{ gap: density.gap }}>
        {header ? (
          <Text
            variant="caption-1-medium"
            style={{ color: palette.textSecondary, paddingHorizontal: 8, paddingVertical: 4 }}
          >
            {header}
          </Text>
        ) : null}
        {loading ? (
          <Loading
            variant="inline"
            size="sm"
            text={loadingLabel ?? messages.searchingSuggestions}
            accessibilityLabel={loadingLabel ?? messages.searchingSuggestions}
            testID={testID ? `${testID}-loading` : undefined}
          />
        ) : empty ? (
          <Text
            accessibilityRole="text"
            style={{ color: palette.textSecondary, padding: 8 }}
            testID={testID ? `${testID}-empty` : undefined}
          >
            {emptyLabel ?? messages.noSuggestions[kind]}
          </Text>
        ) : (
          suggestions.flatMap((suggestion, index) => {
            const selected = index === activeIndex;
            const Icon = suggestion.icon;
            const verified = kind === 'mention' && suggestion.verified === true;
            const name = [
              suggestion.label,
              verified ? messages.suggestionVerified : undefined,
              suggestion.handle,
            ]
              .filter(Boolean)
              .join(verified ? ', ' : ' ');
            const group =
              suggestion.group &&
              (index === 0 || suggestions[index - 1]?.group !== suggestion.group);
            return [
              group ? (
                <Text
                  key={`group-${suggestion.id}`}
                  variant="caption-1-medium"
                  style={{ color: palette.textSecondary, paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  {suggestion.group}
                </Text>
              ) : null,
              <MenuRowShell
                key={suggestion.id}
                role="option"
                nativeID={suggestionOptionId(listboxId, suggestion.id)}
                selected={selected}
                disabled={suggestion.disabled ?? false}
                controlledHighlight
                accessibilityLabel={name}
                onPress={() => onSelectSuggestion?.(suggestion, index)}
                onLayout={(event) => rowPositions.current.set(index, event.nativeEvent.layout.y)}
                onHoverChange={anchor ? undefined : () => onActiveIndexChange?.(index)}
                onPointerMove={(event) => {
                  const { clientX: x, clientY: y, pointerType } = event.nativeEvent;
                  if (pointerType === 'touch') return;
                  const previous = lastPointer.current;
                  lastPointer.current = { x, y };
                  if ((!previous || previous.x !== x || previous.y !== y) && !suggestion.disabled)
                    onActiveIndexChange?.(index);
                }}
                testID={testID ? `${testID}-row-${suggestion.id}` : undefined}
                leading={
                  suggestion.leading ??
                  (Icon ? (
                    <Icon
                      width={density.leadingSize}
                      height={density.leadingSize}
                      fill={suggestion.disabled ? palette.textDisabled : palette.textSecondary}
                    />
                  ) : (
                    <Leading kind={kind} suggestion={suggestion} size={density.leadingSize} />
                  ))
                }
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text
                      numberOfLines={1}
                      style={[
                        menuType(density.type),
                        {
                          color: suggestion.disabled ? palette.textDisabled : palette.text,
                          flexShrink: 1,
                        },
                      ]}
                    >
                      {suggestion.label}
                    </Text>
                    {verified ? (
                      <View testID={testID ? `${testID}-verified-${suggestion.id}` : undefined}>
                        <RiVerifiedBadgeFill width={14} height={14} fill={palette.textSecondary} />
                      </View>
                    ) : null}
                    {suggestion.handle ? (
                      <Text
                        numberOfLines={1}
                        variant="caption-1-regular"
                        style={{ color: palette.textSecondary }}
                      >
                        {suggestion.handle}
                      </Text>
                    ) : null}
                  </View>
                  {suggestion.description ? (
                    <Text
                      numberOfLines={1}
                      variant="caption-1-regular"
                      style={{ color: palette.textSecondary }}
                    >
                      {suggestion.description}
                    </Text>
                  ) : null}
                </View>
              </MenuRowShell>,
            ];
          })
        )}
      </View>
    );
    if (anchor)
      return (
        <SuggestionPanel
          anchor={anchor}
          open={open}
          onOpenChange={onOpenChange}
          listboxId={listboxId}
          label={label}
          maxHeight={maxHeight ?? SUGGESTION_ANCHORED_MAX_HEIGHT}
          busy={loading}
          style={style}
          testID={testID}
          scrollRef={scrollRef}
        >
          {body}
        </SuggestionPanel>
      );
    return (
      <Surface
        style={[{ borderRadius: PANEL_RADIUS, padding: density.panelPadding }, style]}
        testID={testID}
      >
        <ScrollArea
          ref={scrollRef}
          nativeID={listboxId}
          {...((IS_WEB ? { role: 'listbox' } : { accessibilityRole: 'list' }) as Record<
            string,
            unknown
          >)}
          accessibilityLabel={label}
          aria-busy={loading}
          style={{ maxHeight: maxHeight ?? SUGGESTION_MAX_HEIGHT }}
          keyboardShouldPersistTaps="handled"
          {...(IS_WEB ? { onMouseDown: (event: React.MouseEvent) => event.preventDefault() } : {})}
        >
          {body}
        </ScrollArea>
      </Surface>
    );
  }
  return SuggestionList;
}
