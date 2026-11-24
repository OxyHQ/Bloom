import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Avatar } from '../avatar';
import { AGENT_AVATAR_MESSAGES } from '../agent-avatar/messages';
import { AVATAR_MESSAGES } from '../avatar/messages';

// Every call passes through; the spy only records which catalogues were read.
const mockCatalogues: unknown[] = [];
jest.mock('../locale/messages', () => {
  const actual = jest.requireActual('../locale/messages');
  return {
    ...actual,
    useMessages: (catalogue: unknown) => {
      mockCatalogues.push(catalogue);
      return actual.useMessages(catalogue);
    },
  };
});

jest.mock('../agent-avatar/AgentAvatar', () => ({ AgentAvatar: () => null }));

/**
 * An avatar without a character never reads the agent-avatar messages.
 *
 * Only a character's face needs its fallback name ("Agent avatar"), so the
 * lookup lives in `CharacterFace`. In `Avatar` it cost every avatar a locale
 * context read and a hook, once per avatar on every feed row that draws one.
 */
describe('Avatar without a character', () => {
  beforeEach(() => {
    mockCatalogues.length = 0;
  });

  it('does not look up the agent-avatar messages', () => {
    render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Avatar name="Ada" uri="data:image/png;base64,AAAA" />
      </BloomThemeProvider>,
    );

    expect(mockCatalogues).not.toContain(AGENT_AVATAR_MESSAGES);
  });

  // Only the LIVE pill says "LIVE", so only a live avatar reads that catalogue.
  it('reads the live label only when it draws the live pill', () => {
    const tree = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Avatar name="Ada" uri="data:image/png;base64,AAAA" size={40} />
      </BloomThemeProvider>,
    );
    expect(mockCatalogues).not.toContain(AVATAR_MESSAGES);
    tree.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Avatar name="Ada" uri="data:image/png;base64,AAAA" size={40} live />
      </BloomThemeProvider>,
    );
    expect(mockCatalogues).toContain(AVATAR_MESSAGES);
    expect(tree.getByText('LIVE')).toBeTruthy();
  });
});
