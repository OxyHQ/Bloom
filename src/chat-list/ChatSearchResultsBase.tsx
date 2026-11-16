import { View } from 'react-native';
import { EmptyState } from '../empty-state';
import { useMessages } from '../locale/messages';
import { useTheme } from '../theme/use-theme';
import { CHAT_LIST_MESSAGES } from './messages';
import { HighlightedText } from './HighlightedText';
import { chatMarker, groupSearchResults } from './shared';
import type { ChatSearchResultsProps } from './types';

export function createChatSearchResults({ List }: { List: typeof import('../list/List')['List'] }) {
  return function ChatSearchResults({
    query,
    results,
    labels,
    onResultPress,
    loading,
    loadingCount = 6,
    accessibilityLabel,
    style,
    testID,
  }: ChatSearchResultsProps) {
    const { messages } = useMessages(CHAT_LIST_MESSAGES);
    const theme = useTheme();
    const text = { ...messages.search, ...labels };
    return (
      <List
        accessibilityLabel={accessibilityLabel ?? messages.searchResults}
        loading={loading}
        loadingCount={loadingCount}
        style={style}
        testID={testID}
        empty={
          <EmptyState
            variant="compact"
            description={text.empty}
            testID={testID ? `${testID}-empty` : undefined}
          />
        }
        sections={groupSearchResults(results).map((group) => ({
          id: group.kind,
          title: text[group.kind],
          items: group.results.map((result) => {
            const badge = chatMarker(result.chatKind, result.verified, messages.item);
            return {
              id: result.id,
              conversation: {
                name: result.name,
                avatar: result.avatar,
                faces: result.faces,
                status: result.status,
                kind: result.chatKind,
                verified: result.verified,
                time: result.time,
                preview: result.detail ? { text: result.detail } : undefined,
              },
              content: (
                <View pointerEvents="none" aria-hidden style={{ gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 }}>
                    <HighlightedText
                      style={{ flexShrink: 1, minWidth: 0 }}
                      text={result.name}
                      query={query}
                      variant="body-medium"
                      numberOfLines={1}
                      testID={testID ? `${testID}-result-${result.id}-name` : undefined}
                    />
                    {badge ? (
                      <badge.icon
                        width={14}
                        height={14}
                        fill={badge.accent ? theme.colors.primary : theme.colors.textSecondary}
                        testID={testID ? `${testID}-result-${result.id}-marker` : undefined}
                      />
                    ) : null}
                  </View>
                  {result.detail !== undefined ? (
                    <HighlightedText
                      text={result.detail}
                      query={query}
                      variant="body-2-regular"
                      color={theme.colors.textSecondary}
                      numberOfLines={1}
                      testID={testID ? `${testID}-result-${result.id}-detail` : undefined}
                    />
                  ) : null}
                </View>
              ),
              href: result.href,
              onPress: onResultPress ? () => onResultPress(result.id) : undefined,
              testID: testID ? `${testID}-result-${result.id}` : undefined,
            };
          }),
        }))}
      />
    );
  };
}
