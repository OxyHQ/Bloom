import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { GroupCallBar, GroupCallGrid, GroupCallTile, IncomingCallBanner } from '../call-ui';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;
const participant = { id: 'p1', name: 'Ana' };

function themed(size: (typeof sizes)[number][0], children: React.ReactNode) {
  return render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{children}</BloomScope> : children}
    </BloomThemeProvider>,
  );
}

it.each(sizes)('IncomingCallBanner keeps its 40px answer targets under %s scope', (size) => {
  const tree = themed(
    size,
    <IncomingCallBanner name="Ana" onAccept={() => {}} onDecline={() => {}} testID="incoming" />,
  );
  for (const id of ['incoming-accept', 'incoming-decline']) {
    expect(resolvedStyle(tree.getByTestId(id).props.style)).toMatchObject({
      width: 40,
      height: 40,
    });
  }
});

it.each(sizes)('GroupCallBar keeps its explicit join size under %s scope', (size) => {
  const tree = themed(size, <GroupCallBar title="Group" onJoin={() => {}} testID="bar" />);
  expect(resolvedStyle(tree.getByTestId('bar-join').props.style).height).toBe(32);
});

it.each(sizes)('GroupCallTile delegates its video node at %s scope', (size, height) => {
  const tree = themed(
    size,
    <GroupCallTile
      participant={{
        ...participant,
        video: (
          <Button testID="video-action">
            <Text>Video</Text>
          </Button>
        ),
      }}
      width={200}
      height={120}
      testID="tile"
    />,
  );
  expect(resolvedStyle(tree.getByTestId('video-action').props.style).height).toBe(height);
});

it.each(sizes)('GroupCallGrid delegates participant video nodes at %s scope', (size, height) => {
  const tree = themed(
    size,
    <GroupCallGrid
      participants={[
        {
          ...participant,
          video: (
            <Button testID="grid-video">
              <Text>Video</Text>
            </Button>
          ),
        },
      ]}
      width={220}
      testID="grid"
    />,
  );
  expect(resolvedStyle(tree.getByTestId('grid-video').props.style).height).toBe(height);
  expect(resolvedStyle(tree.getByTestId('grid-tile-p1').props.style)).toMatchObject({
    width: 220,
    height: 220,
  });
});
