import { useRef, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, View, type ScrollView } from 'react-native';
import { Divider } from '../divider';
import { CHAT_PEOPLE_MESSAGES } from '../chat-people/messages';
import { useMessages } from '../locale/messages';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import * as Skeleton from '../skeleton';
import { Text } from '../typography';
import type { ListProps } from './types';

export function createList({
  ListItem,
  ScrollArea,
}: {
  ListItem: typeof import('./ListItem')['ListItem'];
  ScrollArea: typeof import('../layout/ScrollArea')['ScrollArea'];
}) {
  return function List({
    items,
    sections,
    header,
    footer,
    empty,
    loading = false,
    loadingCount = 8,
    accessibilityLabel,
    style,
    testID,
    separator = 'none',
    height,
    scrollable,
    sectionIndex,
    stickyHeaders: stickyProp,
  }: ListProps) {
    const groups = (sections ?? [{ id: 'all', items: items ?? [] }]).filter(
      (section) => section.items.length > 0,
    );
    const theme = useTheme();
    const fill = useSurfaceFill();
    const { messages } = useMessages(CHAT_PEOPLE_MESSAGES);
    const scroller = useRef<ComponentRef<typeof ScrollView> | null>(null);
    const offsets = useRef(new Map<string, number>());
    const scroll = scrollable ?? (height !== undefined || sectionIndex !== undefined);
    // RN's layered sticky wrappers left contact rows unpainted on Android
    // Fabric until scrolling. Preserve opt-in there (docs/chat-people.mdx).
    const sticky = scroll && (stickyProp ?? Platform.OS !== 'android');
    const stickyIndices: number[] = [];
    const children: ReactNode[] = [];
    if (header !== undefined) children.push(<View key="header">{header}</View>);
    if (loading)
      children.push(
        <View
          key="loading"
          testID={testID ? `${testID}-skeleton` : undefined}
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: loadingCount }, (_, index) => (
            <View
              key={index}
              testID={testID ? `${testID}-skeleton-row-${index}` : undefined}
              style={{
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                gap: 10,
              }}
            >
              <Skeleton.Circle size={36} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton.Box width="55%" height={12} borderRadius={4} />
                <Skeleton.Box width="80%" height={10} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>,
      );
    else if (!groups.length) children.push(<View key="empty">{empty}</View>);
    else
      for (const section of groups) {
        if (section.title) {
          if (sticky) stickyIndices.push(children.length);
          children.push(
            <View
              key={`${section.id}-heading`}
              onLayout={(event) => offsets.current.set(section.id, event.nativeEvent.layout.y)}
              style={{ backgroundColor: fill }}
            >
              <Text
                variant="caption-1-semibold"
                accessibilityRole="header"
                testID={testID ? `${testID}-heading-${section.id}` : undefined}
                style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}
              >
                {section.title}
              </Text>
            </View>,
          );
        }
        const rows = section.items.map(({ id, ...item }, index) => (
          <View key={id} role="listitem">
            <ListItem {...item} testID={item.testID ?? (testID ? `${testID}-${id}` : undefined)} />
            {separator !== 'none' && index < section.items.length - 1 ? (
              <View style={{ paddingLeft: separator === 'inset' ? 56 : 10, paddingRight: 10 }}>
                <Divider />
              </View>
            ) : null}
          </View>
        ));
        children.push(
          section.title ? (
            <View
              collapsable={false}
              key={section.id}
              role="list"
              accessibilityLabel={section.title}
            >
              {rows}
            </View>
          ) : (
            <View key={section.id} role="presentation">
              {rows}
            </View>
          ),
        );
      }
    if (footer !== undefined) children.push(<View key="footer">{footer}</View>);
    const indexIds = sectionIndex?.ids ?? groups.map((group) => group.id);
    return (
      <View
        collapsable={false}
        role="list"
        accessibilityLabel={accessibilityLabel}
        aria-busy={loading || undefined}
        accessibilityState={{ busy: loading }}
        style={[{ position: 'relative' }, style]}
        testID={testID}
      >
        {scroll ? (
          <ScrollArea
            ref={scroller}
            style={{ height, paddingRight: sectionIndex ? 22 : 0 }}
            stickyHeaderIndices={stickyIndices.length ? stickyIndices : undefined}
            testID={testID ? `${testID}-scroll` : undefined}
          >
            {children}
          </ScrollArea>
        ) : (
          children
        )}
        {sectionIndex && !loading && groups.length ? (
          <View
            style={{
              position: 'absolute',
              top: 8,
              bottom: 8,
              right: 2,
              width: 22,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
            testID={testID ? `${testID}-index` : undefined}
          >
            {indexIds.map((id) => (
              <Pressable
                key={id}
                role="button"
                accessibilityLabel={(sectionIndex.labelFor ?? messages.jumpTo)(id)}
                onPress={() => {
                  if (!groups.some((group) => group.id === id)) return;
                  const y = offsets.current.get(id);
                  if (y !== undefined) scroller.current?.scrollTo({ y, animated: true });
                  sectionIndex.onJump?.(id);
                }}
                hitSlop={{ top: 2, bottom: 2, left: 6, right: 6 }}
                style={{ paddingVertical: 1 }}
                testID={testID ? `${testID}-jump-${id}` : undefined}
              >
                <Text
                  variant={id === sectionIndex.activeId ? 'caption-2-bold' : 'caption-2-medium'}
                  style={{
                    color:
                      id === sectionIndex.activeId
                        ? theme.colors.primary
                        : theme.colors.textSecondary,
                  }}
                >
                  {id}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  };
}
