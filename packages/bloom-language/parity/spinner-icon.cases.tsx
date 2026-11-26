import { Platform } from 'react-native';
import { SpinnerIcon } from '@oxy.so/bloom/loading';
import { withAlpha } from '@oxy.so/bloom/theme';

import * as L from '../src/__tests__/support/language.generated';
import { toElement } from '../src/render';
import { defineTokens } from '../src/tokens';
import { type ParityCase, Themed } from './support/cases';

/** An app's own colour: Mention's white over video, the same in both schemes. */
const APP = defineTokens({ color: { onVideo: '#FFFFFF' } });

/** Bloom's `SpinnerIcon` as an app draws it: a size, a colour from the theme, a style. */
export const SPINNER_ICON_CASES: readonly ParityCase[] = [
  {
    name: 'a spinner glyph',
    language: () => toElement(L.SpinnerIcon()),
    bloom: () => <SpinnerIcon />,
  },
  {
    name: 'a spinner glyph at an icon rung',
    language: () => toElement(L.SpinnerIcon().size('lg')),
    bloom: () => <SpinnerIcon size={24} />,
  },
  {
    name: 'a spinner glyph at a numeric side',
    language: () => toElement(L.SpinnerIcon().size('18')),
    bloom: () => <SpinnerIcon size={18} />,
  },
  {
    name: 'a spinner glyph in a role',
    language: () => toElement(L.SpinnerIcon().size('md').tint('primary')),
    bloom: () => <Themed>{(c) => <SpinnerIcon size={20} color={c.primary} />}</Themed>,
  },
  {
    name: 'a spinner glyph in an app colour',
    language: () => toElement(L.SpinnerIcon().size('2xl').tint(APP.color.onVideo)),
    bloom: () => <SpinnerIcon size={32} color="#FFFFFF" />,
  },
  {
    name: 'a spinner glyph in a role at an opacity',
    language: () => toElement(L.SpinnerIcon().tint('muted/70')),
    bloom: () => <Themed>{(c) => <SpinnerIcon color={withAlpha(c.textSecondary, 0.7)} />}</Themed>,
  },
  {
    // Its box is its `style`; on the web a role in it is its CSS variable.
    name: 'a spinner glyph in a box',
    language: () =>
      toElement(L.SpinnerIcon().size('sm').padding('xs').background('surface').margin('top', 'sm')),
    bloom: () => (
      <Themed>
        {(c) => (
          <SpinnerIcon
            size={16}
            style={{
              paddingTop: 4,
              paddingBottom: 4,
              paddingStart: 4,
              paddingEnd: 4,
              backgroundColor: Platform.OS === 'web' ? 'var(--surface)' : c.backgroundSecondary,
              marginTop: 8,
            }}
          />
        )}
      </Themed>
    ),
  },
];
