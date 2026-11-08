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

describe('local SVG capabilities through BloomProvider', () => {
  it('needs no hosted runtime or raster backend', () => {
    expect(BLOOM_CHARACTER_RUNTIME_URL).toBe('');
    render(
      <BloomProvider>
        <Probe />
      </BloomProvider>,
    );
    expect(seen).not.toHaveProperty('runtimeUrl');
    expect(seen).not.toHaveProperty('stills');
  });

  it('an avatar with no provider needs no runtime URL', () => {
    render(<Probe />);
    expect(seen).not.toHaveProperty('runtimeUrl');
  });

  it('ignores the deprecated provider URL', () => {
    render(
      <BloomProvider characterRuntimeUrl="https://app.test/bloom-character/runtime.mjs">
        <Probe />
      </BloomProvider>,
    );
    expect(seen).not.toHaveProperty('runtimeUrl');
  });

  it('a nested provider retains the same local SVG contract', () => {
    render(
      <BloomProvider>
        <AgentAvatarProvider runtimeUrl="https://inner.test/runtime.mjs">
          <Probe />
        </AgentAvatarProvider>
      </BloomProvider>,
    );
    expect(seen).not.toHaveProperty('runtimeUrl');
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
