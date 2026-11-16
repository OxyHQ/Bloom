import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { CallScreen } from '../call-ui/CallScreen';
import { IncomingCallScreen } from '../call-ui/IncomingCallScreen';
import { StoryViewer } from '../chat-people/StoryViewer';
import { findHost, type HostNode } from './support/rendered-style';
import { createYogaHostRenderer } from './support/yoga-host-tree';

let yoga: ReturnType<typeof createYogaHostRenderer>;
beforeAll(() => {
  yoga = createYogaHostRenderer();
}, 120_000);
afterAll(() => yoga?.dispose());
const noop = () => {};
const cases = [
  [
    'call',
    <CallScreen
      key="call"
      name="Ana"
      status="active"
      onMinimise={noop}
      controls={{ onMutedChange: noop, onEndCall: noop }}
      testID="media"
    />,
    [
      ['media-minimise', 36],
      ['media-controls-mute', 56],
      ['media-controls-end', 56],
    ],
    'media-identity-scroll',
  ],
  [
    'incoming',
    <IncomingCallScreen
      key="incoming"
      name="Ana"
      onAccept={noop}
      onDecline={noop}
      onMessage={noop}
      onRemind={noop}
      testID="media"
    />,
    [
      ['media-accept', 56],
      ['media-decline', 56],
      ['media-message', 32],
      ['media-remind', 32],
    ],
    'media-identity-scroll',
  ],
  [
    'story',
    <StoryViewer
      key="story"
      stories={[{ id: 'a' }]}
      index={0}
      name="Ana"
      time="now"
      onClose={noop}
      onReplyChange={noop}
      onReplySend={noop}
      reactions={['❤️']}
      onReact={noop}
      testID="media"
    />,
    [
      ['media-close', 36],
      ['media-send', 36],
      ['media-react-❤️', 36],
    ],
    'media-composer-scroll',
  ],
] as const;

function treeFor(content: React.ReactNode, width: number, height: number): HostNode {
  const api = render(
    <BloomThemeProvider>
      <View testID="viewport" style={{ width, height }}>
        {content}
      </View>
    </BloomThemeProvider>,
  );
  const tree = findHost(api.toJSON(), 'viewport');
  if (!tree) throw new Error('Missing native viewport');
  return tree;
}

describe.each(cases)('%s native bounds', (_name, content, controls, scroller) => {
  it.each([
    [1280, 390],
    [390, 640],
    [390, 844],
    [1280, 900],
  ])('keeps controls inside %i×%i without shrinking their domain geometry', (width, height) => {
    const boxes = yoga.layout(treeFor(content, width, height), false, 40, true);
    expect(boxes.get('media')).toMatchObject({ width, height });
    for (const [id, expectedHeight] of controls) {
      const box = boxes.get(id);
      expect(box).toBeDefined();
      if (!box) throw new Error(`Missing ${id}`);
      expect(box.height).toBe(expectedHeight);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
    }
    expect(boxes.get(scroller)?.height).toBeGreaterThan(0);
  });

  it('detects the old minimum-height overflow in a short parent', () => {
    const tree = treeFor(content, 1280, 390);
    const media = findHost(tree, 'media');
    if (!media) throw new Error('Missing media host');
    media.props.style = [media.props.style, { minHeight: 520 }];
    const boxes = yoga.layout(tree, false, 40, true);
    expect(boxes.get('media')?.height).toBe(520);
    expect(
      controls.some(([id]) => {
        const box = boxes.get(id);
        return box != null && box.y + box.height > 390;
      }),
    ).toBe(true);
  });
});

it('lets incoming identity content exceed its scroll viewport while answer actions remain visible', () => {
  const boxes = yoga.layout(treeFor(cases[1][1], 1280, 390), false, 40, true);
  const viewport = boxes.get('media-identity-scroll');
  const content = boxes.get('media-identity-scroll-content-layout');
  expect(viewport).toBeDefined();
  expect(content).toBeDefined();
  expect(content?.height).toBeGreaterThan(viewport?.height ?? Infinity);
});
