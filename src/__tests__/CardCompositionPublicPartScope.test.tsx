import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  SelectionCard,
} from '../card';
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

function sample() {
  return (
    <>
      <Card testID="card">
        <Button testID="card-child">
          <Text>Card</Text>
        </Button>
      </Card>
      <CardHeader>
        <Button testID="header-child">
          <Text>Header</Text>
        </Button>
      </CardHeader>
      <CardBody>
        <Button testID="body-child">
          <Text>Body</Text>
        </Button>
      </CardBody>
      <CardFooter>
        <Button testID="footer-child">
          <Text>Footer</Text>
        </Button>
      </CardFooter>
      <SelectionCard
        selection="single"
        selected={false}
        onPress={() => {}}
        title="Plan"
        testID="selection"
      >
        <Button testID="selection-child">
          <Text>Details action</Text>
        </Button>
      </SelectionCard>
      {/* biome-ignore lint/correctness/noReactNativeRawText: CardTitle renders string children in Bloom Text. */}
      <CardTitle>Title</CardTitle>
      {/* biome-ignore lint/correctness/noReactNativeRawText: CardDescription renders string children in Bloom Text. */}
      <CardDescription>Description</CardDescription>
    </>
  );
}

it.each(sizes)('Card surfaces and slots delegate child controls under %s scope', (size, height) => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{sample()}</BloomScope> : sample()}
    </BloomThemeProvider>,
  );
  for (const id of [
    'card-child',
    'header-child',
    'body-child',
    'footer-child',
    'selection-child',
  ]) {
    expect(resolvedStyle(tree.getByTestId(id).props.style).height).toBe(height);
  }
});

it.each(sizes)('CardTitle and CardDescription keep semantic typography under %s scope', (size) => {
  const subject = (
    <>
      {/* biome-ignore lint/correctness/noReactNativeRawText: CardTitle renders string children in Bloom Text. */}
      <CardTitle>Title</CardTitle>
      {/* biome-ignore lint/correctness/noReactNativeRawText: CardDescription renders string children in Bloom Text. */}
      <CardDescription>Description</CardDescription>
    </>
  );
  const tree = render(
    <BloomThemeProvider fonts={false}>
      {size ? <BloomScope size={size}>{subject}</BloomScope> : subject}
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByText('Title').props.style).fontSize).toBe(17);
  expect(resolvedStyle(tree.getByText('Description').props.style).fontSize).toBe(14);
});

it('Card child slots resolve the nearest nested lg scope', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <BloomScope size="xs">
        <BloomScope size="lg">{sample()}</BloomScope>
      </BloomScope>
    </BloomThemeProvider>,
  );
  for (const id of [
    'card-child',
    'header-child',
    'body-child',
    'footer-child',
    'selection-child',
  ]) {
    expect(resolvedStyle(tree.getByTestId(id).props.style).height).toBe(44);
  }
  expect(resolvedStyle(tree.getByText('Title').props.style).fontSize).toBe(17);
  expect(resolvedStyle(tree.getByText('Description').props.style).fontSize).toBe(14);
});
