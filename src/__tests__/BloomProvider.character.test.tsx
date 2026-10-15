import React, { useContext } from 'react';
import { render } from '@testing-library/react-native';

import { BloomProvider } from '../provider';
import { AgentAvatarProvider, BLOOM_CHARACTER_RUNTIME_URL } from '../agent-avatar';
import { CharacterRuntimeContext } from '../agent-avatar/context';

let seen: React.ContextType<typeof CharacterRuntimeContext>;
function Probe() {
  seen = useContext(CharacterRuntimeContext);
  return null;
}

describe('the character runtime is reachable from BloomProvider alone', () => {
  it('names the SDK-hosted runtime by default, and never the host app’s own origin', () => {
    expect(BLOOM_CHARACTER_RUNTIME_URL).toBe('https://alia.onl/bloom-character/runtime.mjs');
    render(
      <BloomProvider>
        <Probe />
      </BloomProvider>,
    );
    expect(seen.runtimeUrl).toBe(BLOOM_CHARACTER_RUNTIME_URL);
    expect(seen.stills).toBeDefined();
  });

  it('an avatar with no provider at all gets the same default instead of a relative URL', () => {
    render(<Probe />);
    expect(seen.runtimeUrl).toBe(BLOOM_CHARACTER_RUNTIME_URL);
  });

  it('characterRuntimeUrl replaces it for an app that self-hosts', () => {
    render(
      <BloomProvider characterRuntimeUrl="https://app.test/bloom-character/runtime.mjs">
        <Probe />
      </BloomProvider>,
    );
    expect(seen.runtimeUrl).toBe('https://app.test/bloom-character/runtime.mjs');
  });

  it('an AgentAvatarProvider inside still wins for its own subtree', () => {
    render(
      <BloomProvider>
        <AgentAvatarProvider runtimeUrl="https://inner.test/runtime.mjs">
          <Probe />
        </AgentAvatarProvider>
      </BloomProvider>,
    );
    expect(seen.runtimeUrl).toBe('https://inner.test/runtime.mjs');
  });

  it('renders no WebView and fetches nothing until a character is asked for', () => {
    const fetchMock = jest.fn();
    const original = globalThis.fetch;
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    try {
      const view = render(
        <BloomProvider>
          <Probe />
        </BloomProvider>,
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(view.UNSAFE_queryAllByProps({ javaScriptEnabled: true })).toHaveLength(0);
    } finally {
      globalThis.fetch = original;
    }
  });
});
