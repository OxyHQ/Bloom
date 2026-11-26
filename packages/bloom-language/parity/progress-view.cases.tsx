import { ActivityIndicator, Platform } from 'react-native';

import * as L from '../src/__tests__/support/language.generated';
import { toElement } from '../src/render';
import { defineTokens } from '../src/tokens';
import { type ParityCase, Themed } from './support/cases';

/** An app's own colour, the same in both schemes. */
const APP = defineTokens({ color: { onVideo: '#FFFFFF' } });

/** React Native's `ActivityIndicator` as Allo draws it: a size, a colour from the theme, a name. */
export const PROGRESS_VIEW_CASES: readonly ParityCase[] = [
  {
    name: 'the platform spinner',
    language: () => toElement(L.ProgressView()),
    bloom: () => <ActivityIndicator />,
  },
  {
    // Allo's conversation, blocked list and devices while they load.
    name: 'the platform spinner in the primary colour',
    language: () => toElement(L.ProgressView().tint('primary')),
    bloom: () => <Themed>{(c) => <ActivityIndicator color={c.primary} />}</Themed>,
  },
  {
    // Allo's history transfer banner: small, in the brand container's ink.
    name: 'the platform spinner, small, in a role',
    language: () => toElement(L.ProgressView().size('small').tint('primaryText')),
    bloom: () => (
      <Themed>{(c) => <ActivityIndicator size="small" color={c.primarySubtleForeground} />}</Themed>
    ),
  },
  {
    name: 'the platform spinner, large, in an app colour, named',
    language: () =>
      toElement(
        L.ProgressView().size('large').tint(APP.color.onVideo).label('Loading').testID('spin'),
      ),
    bloom: () => (
      <ActivityIndicator size="large" color="#FFFFFF" accessibilityLabel="Loading" testID="spin" />
    ),
  },
  {
    name: 'the platform spinner in a box',
    language: () => toElement(L.ProgressView().padding('md').background('surface')),
    bloom: () => (
      <Themed>
        {(c) => (
          <ActivityIndicator
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              paddingStart: 12,
              paddingEnd: 12,
              backgroundColor: Platform.OS === 'web' ? 'var(--surface)' : c.backgroundSecondary,
            }}
          />
        )}
      </Themed>
    ),
  },
];
