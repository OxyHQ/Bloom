import { TagField } from '@oxy.so/bloom/tag-field';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const lower = (raw: string) => raw.toLowerCase();
const TAGS = ['design', 'react'];
const SUGGESTIONS = ['design', 'docs', { value: 'dev', label: 'Development', meta: '12' }];

export const TAG_FIELD_CASES: readonly ParityCase[] = [
  {
    name: 'a tag field',
    language: () => toElement(L.TagField([TAGS, set], 'Topics')),
    bloom: () => <TagField value={TAGS} onChange={set} label="Topics" />,
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} tag field`,
    language: () =>
      toElement(L.TagField([TAGS, set]).size(size).placeholder('Add a topic').label('Topics')),
    bloom: () => (
      <TagField
        value={TAGS}
        onChange={set}
        size={size}
        placeholder="Add a topic"
        accessibilityLabel="Topics"
      />
    ),
  })),
  // `secondary` and `tertiary` are AccentTones TagField's type takes, but Bloom's chip paint
  // throws on them (`resolveAccentColors` has no palette for either): no app can draw them.
  ...ENUMS.accentTone
    .filter((tone) => tone !== 'secondary' && tone !== 'tertiary')
    .map((tone) => ({
      name: `${tone} chips`,
      language: () => toElement(L.TagField([TAGS, set], 'Topics').tint(tone)),
      bloom: () => <TagField value={TAGS} onChange={set} label="Topics" tone={tone} />,
    })),
  {
    name: 'suggestions, a ceiling, a query of its own, invalid',
    language: () =>
      toElement(
        L.TagField([TAGS, set], 'Topics')
          .suggestions(SUGGESTIONS, 3)
          .allowsCreate(false)
          .max(3)
          .onMaxReached(set)
          .normalize(lower)
          .query(['de', set])
          .invalid()
          .labels({ suggestions: 'Ideas' })
          .testID('topics'),
      ),
    bloom: () => (
      <TagField
        value={TAGS}
        onChange={set}
        label="Topics"
        suggestions={SUGGESTIONS}
        maxSuggestions={3}
        allowCreate={false}
        max={3}
        onMaxReached={set}
        normalize={lower}
        inputValue="de"
        onInputValueChange={set}
        invalid
        labels={{ suggestions: 'Ideas' }}
        testID="topics"
      />
    ),
  },
  {
    name: 'a disabled tag field',
    language: () => toElement(L.TagField([TAGS, set], 'Topics').disabled()),
    bloom: () => <TagField value={TAGS} onChange={set} label="Topics" disabled />,
  },
];
