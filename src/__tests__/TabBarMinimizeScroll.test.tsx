import { act, render } from '@testing-library/react-native';
import type { ScrollHandlerProcessed } from 'react-native-reanimated';

import {
  setMinimized,
  TabBarMinimizeProvider,
  useExpandTabBar,
  useMinimizeOnScroll,
  useMinimizeState,
  type MinimizeState,
} from '../tab-bar';

type Handler = ScrollHandlerProcessed<Record<string, unknown>>;

function Probe({
  consumerHandler,
  onReady,
}: {
  consumerHandler: Handler | null;
  onReady: (handler: Handler, expand: () => void, state: MinimizeState) => void;
}) {
  const handler = useMinimizeOnScroll(consumerHandler);
  const expand = useExpandTabBar();
  const state = useMinimizeState();
  onReady(handler, expand, state);
  return null;
}

describe('tab-bar minimize scroll binding', () => {
  it('composes the consumer Reanimated handler into the returned binding', () => {
    const consumerHandler = jest.fn() as Handler;
    let handler: Handler | undefined;

    render(
      <TabBarMinimizeProvider>
        <Probe
          consumerHandler={consumerHandler}
          onReady={(nextHandler) => {
            handler = nextHandler;
          }}
        />
      </TabBarMinimizeProvider>,
    );

    if (!handler) throw new Error('Probe did not expose its scroll handler');
    const event = { eventName: 'onScrollBeginDrag' } as unknown as Parameters<Handler>[0];
    handler(event);
    expect(consumerHandler).toHaveBeenCalledWith(event);
  });

  it('returns a focus-safe callback that expands the provider state', () => {
    let expand: (() => void) | undefined;
    let state: MinimizeState | undefined;

    render(
      <TabBarMinimizeProvider>
        <Probe
          consumerHandler={null}
          onReady={(_handler, nextExpand, nextState) => {
            expand = nextExpand;
            state = nextState;
          }}
        />
      </TabBarMinimizeProvider>,
    );

    if (!expand || !state) throw new Error('Probe did not expose the minimize controls');
    const resolvedExpand = expand;
    const resolvedState = state;
    act(() => setMinimized(resolvedState, 1));
    expect(resolvedState.progress.value).toBe(1);
    act(resolvedExpand);
    expect(resolvedState.progress.value).toBe(0);
  });
});
