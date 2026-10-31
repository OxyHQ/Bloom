import { useContext } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { CharacterAvatar } from '../CharacterAvatar';
import { AgentAvatarProvider } from '../AgentAvatarProvider';
import {
  AvatarSnapshotObserver,
  CharacterCapabilitiesContext,
  type CaptureAvatarSnapshot,
} from '../context';
import { BloomImage } from '../../image/BloomImage';

const mockInject = jest.fn(),
  mockMount = jest.fn();
jest.mock('../character-webview', () => {
  const React = require('react');
  const View = require('react-native').View;
  return {
    characterWebView: () =>
      React.useMemo(
        () =>
          React.forwardRef((props: object, ref: unknown) => {
            React.useEffect(() => {
              mockMount();
            }, []);
            React.useImperativeHandle(ref, () => ({ injectJavaScript: mockInject }));
            return React.createElement(View, { ...props, testID: 'portrait-webview' });
          }),
        [],
      ),
  };
});
jest.mock('../../image/BloomImage', () => ({
  BloomImage: (props: object) =>
    require('react').createElement(require('react-native').View, {
      ...props,
      testID: 'portrait-image',
    }),
}));
const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
let view: ReactTestRenderer;
const webViews = () =>
  view.root.findAll(
    (node) => typeof node.type === 'string' && node.props.testID === 'portrait-webview',
  );
const message = (data: string) =>
  act(() => webViews()[0]!.props.onMessage({ nativeEvent: { data } }));
const latestJob = () =>
  JSON.parse(
    (mockInject.mock.calls[mockInject.mock.calls.length - 1]![0] as string).match(
      /window.renderStill\?\.\((.*)\); true;/,
    )![1]!,
  );
beforeEach(() => {
  mockInject.mockClear();
  mockMount.mockClear();
});
afterEach(() => act(() => view?.unmount()));

it('draws nine distinct frozen native previews in one document and reports readiness only after the image loads', async () => {
  const ready = jest.fn();
  act(() => {
    view = create(
      <AgentAvatarProvider>
        {Array.from({ length: 9 }, (_, i) => (
          <CharacterAvatar
            key={i}
            character={{ preset: 'blue_beret', eyeSpacing: 0.5 + i / 10 }}
            portrait
            paused
            interactive={false}
            size={56}
            label={`Agent ${i}`}
            onReady={ready}
          />
        ))}
      </AgentAvatarProvider>,
    );
  });
  await flush();
  expect(webViews()).toHaveLength(1);
  message('loaded');
  for (let i = 0; i < 9; i++) {
    const { id } = latestJob();
    message(`snapshot:${JSON.stringify({ id, uri: `data:image/png;base64,${i}` })}`);
    await flush();
  }
  expect(mockMount).toHaveBeenCalledTimes(1);
  expect(ready).not.toHaveBeenCalled();
  const images = view.root.findAllByType(BloomImage);
  expect(images).toHaveLength(9);
  act(() => {
    for (const image of images) {
      image.props.onLoad();
      image.props.onLoad();
    }
  });
  expect(ready).toHaveBeenCalledTimes(9);
  expect(
    view.root.findAll((node) => node.props.accessibilityLabel === 'Agent 0').length,
  ).toBeGreaterThan(0);
});

it('separates eye-only and full portraits and preserves snapshot and runtime capability reports', async () => {
  let capture: CaptureAvatarSnapshot | null = null;
  let catalog: React.ContextType<typeof CharacterCapabilitiesContext>;
  const Probe = () => {
    catalog = useContext(CharacterCapabilitiesContext);
    return null;
  };
  act(() => {
    view = create(
      <AgentAvatarProvider>
        <Probe />
        <CharacterAvatar character={{ preset: 'blue_beret' }} portrait />
        <AvatarSnapshotObserver.Provider
          value={(value) => {
            capture = value;
          }}
        >
          <CharacterAvatar character={{ preset: 'blue_beret' }} portrait previewPart="eyes" />
        </AvatarSnapshotObserver.Provider>
      </AgentAvatarProvider>,
    );
  });
  await flush();
  message('loaded');
  expect(latestJob().previewPart).toBeUndefined();
  message(`snapshot:${JSON.stringify({ id: latestJob().id, uri: 'data:image/png;base64,body' })}`);
  await flush();
  const eyes = latestJob();
  expect(eyes.previewPart).toBe('eyes');
  const capabilities = {
    key: 'eyes',
    available: { 'eyes:oval': true },
    selected: { eyes: 'oval' },
  };
  message(`capabilities:${JSON.stringify({ id: eyes.id, value: capabilities })}`);
  expect(catalog!.capabilitiesByKey!.get('eyes')).toEqual(capabilities);
  message(`snapshot:${JSON.stringify({ id: eyes.id, uri: 'data:image/png;base64,eyes' })}`);
  await flush();
  expect(await capture!()).toBeNull();
  act(() => view.root.findAllByType(BloomImage)[1]!.props.onLoad());
  expect(await capture!()).toEqual({ uri: 'data:image/png;base64,eyes' });
});

it('keeps temporarily paused live avatars and standalone portraits on their existing renderer', () => {
  act(() => {
    view = create(
      <AgentAvatarProvider>
        <CharacterAvatar character={{ preset: 'blue_beret' }} paused />
        <CharacterAvatar character={{ preset: 'alfred' }} portrait interactive />
      </AgentAvatarProvider>,
    );
  });
  expect(webViews()).toHaveLength(2);
  act(() => view.update(<CharacterAvatar character={{ preset: 'blue_beret' }} portrait />));
  expect(webViews()).toHaveLength(1);
  expect(view.root.findAllByType(BloomImage)).toHaveLength(0);
});

it('shows the existing translated unavailable state after a failed still, without rerendering it in a loop', async () => {
  act(() => {
    view = create(
      <AgentAvatarProvider>
        <CharacterAvatar character={{ preset: 'blue_beret' }} portrait />
      </AgentAvatarProvider>,
    );
  });
  await flush();
  message('loaded');
  message(`snapshot:${JSON.stringify({ id: latestJob().id, uri: null })}`);
  await flush();
  expect(view.root.findAllByType(BloomImage)).toHaveLength(0);
  expect(mockInject).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(view.toJSON())).toContain('unavailable');
});

it('does not display an obsolete character when its queued capture completes after an edit', async () => {
  const render = (preset: 'blue_beret' | 'alfred') => (
    <AgentAvatarProvider>
      <CharacterAvatar character={{ preset }} portrait />
    </AgentAvatarProvider>
  );
  act(() => {
    view = create(render('blue_beret'));
  });
  await flush();
  message('loaded');
  const old = latestJob();
  act(() => view.update(render('alfred')));
  message(`snapshot:${JSON.stringify({ id: old.id, uri: 'data:image/png;base64,old' })}`);
  await flush();
  expect(view.root.findAllByType(BloomImage)).toHaveLength(0);
  expect(latestJob().character.preset).toBe('alfred');
  message(`snapshot:${JSON.stringify({ id: latestJob().id, uri: 'data:image/png;base64,new' })}`);
  await flush();
  expect(view.root.findByType(BloomImage).props.source).toBe('data:image/png;base64,new');
});
