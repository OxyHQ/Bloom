import { useContext } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import {
  CharacterRuntimeContext,
  CharacterCapabilitiesContext,
  type CharacterCapabilities,
} from '../context';

describe('runtime-scoped avatar capabilities', () => {
  let renderer: ReactTestRenderer;
  type ObservedContext = React.ContextType<typeof CharacterRuntimeContext> &
    React.ContextType<typeof CharacterCapabilitiesContext>;
  let context: ObservedContext;
  let observations: ObservedContext[];
  function Consumer() {
    context = {
      ...useContext(CharacterRuntimeContext),
      ...useContext(CharacterCapabilitiesContext),
    };
    observations.push(context);
    return null;
  }
  const render = (runtimeUrl: string) => (
    <AgentAvatarProvider runtimeUrl={runtimeUrl}>
      <Consumer />
    </AgentAvatarProvider>
  );
  const capabilities = (available: boolean, selected = 'oval'): CharacterCapabilities => ({
    key: 'same-saved-recipe',
    available: { 'eyes:dots': available },
    selected: { eyes: selected },
  });
  beforeEach(() => {
    observations = [];
    act(() => {
      renderer = create(render('/runtime.mjs?v=one'));
    });
  });
  afterEach(() => act(() => renderer.unmount()));

  it('replaces stale availability and actual selections for the same saved recipe', () => {
    act(() => context.reportCapabilities!(capabilities(false)));
    expect(context.capabilitiesByKey!.get('same-saved-recipe')!.available['eyes:dots']).toBe(false);
    act(() => context.reportCapabilities!(capabilities(true, 'dots')));
    expect(context.capabilitiesByKey!.get('same-saved-recipe')).toEqual(capabilities(true, 'dots'));
    const previousMap = context.capabilitiesByKey;
    act(() => context.reportCapabilities!(capabilities(true, 'dots')));
    expect(context.capabilitiesByKey).toBe(previousMap);
  });

  it('ignores legacy hosting changes without discarding SVG capabilities', () => {
    act(() => context.reportCapabilities!(capabilities(true)));
    const known = context.capabilitiesByKey;
    act(() => renderer.update(render('https://invalid.example/retired-runtime.mjs')));
    expect(context.capabilitiesByKey).toBe(known);
    expect(context).not.toHaveProperty('runtimeUrl');
    expect(context).not.toHaveProperty('stills');
  });
});
