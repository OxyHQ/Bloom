/**
 * A boundary double, not a second suggestion implementation. Shared Bloom
 * tests own placement, scroll and dismissal. These suites exercise the editor
 * against the public props and real option IDs, without importing native UI
 * peers into every headless editor test.
 */
import { createElement } from 'react';
import type { SuggestionListProps } from '../../../../../../src/chat-composer/types';
export { suggestionOptionId } from '../../../../../../src/chat-composer/suggestion-option-id';
import { suggestionOptionId } from '../../../../../../src/chat-composer/suggestion-option-id';
export type { SuggestionAnchor } from '../../../../../../src/chat-composer/types';
export const renderedSuggestions = new Map<string, SuggestionListProps>();
export function SuggestionList(props: SuggestionListProps) {
  const id = props.listboxId ?? 'test-suggestions';
  renderedSuggestions.set(id, props);
  return createElement(
    'div',
    { role: 'listbox', id },
    props.loading
      ? 'Loading'
      : props.suggestions.length === 0
        ? props.emptyLabel
        : props.suggestions.map((item, index) =>
            createElement(
              'button',
              {
                key: item.id,
                id: suggestionOptionId(id, item.id),
                role: 'option',
                tabIndex: -1,
                'aria-selected': props.activeIndex === index,
                onClick: () => props.onSelectSuggestion?.(item, index),
              },
              item.label,
            ),
          ),
  );
}
