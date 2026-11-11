/* biome-ignore-all lint/correctness/noReactNativeRawText: Bloom typography components accept and render text children. */
import { render } from '@testing-library/react-native';
import { Text as RNText } from 'react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  Blockquote,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Large,
  Lead,
  Muted,
  P,
  Small,
  Span,
  Subtitle,
  Text,
  Title,
  TypographyScope,
} from '../typography';
import type { TypographyScale } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const TEXT_PARTS = [
  'text',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'title',
  'subtitle',
  'paragraph',
  'lead',
  'large',
  'small',
  'muted',
] as const;

function Subject({
  scope,
  nestedScope,
  typographyScale = 'desktop',
}: {
  scope?: BloomSize;
  nestedScope?: BloomSize;
  typographyScale?: TypographyScale;
}) {
  const text = (
    <TypographyScope scale={typographyScale}>
      <Text testID="text" variant="body-medium">
        <RNText>Body text</RNText>
      </Text>
      <Span testID="span" variant="caption-1-medium">
        <RNText>Span</RNText>
      </Span>
      <H1 testID="h1">
        <RNText>Heading one</RNText>
      </H1>
      <H2 testID="h2">
        <RNText>Heading two</RNText>
      </H2>
      <H3 testID="h3">
        <RNText>Heading three</RNText>
      </H3>
      <H4 testID="h4">
        <RNText>Heading four</RNText>
      </H4>
      <H5 testID="h5">
        <RNText>Heading five</RNText>
      </H5>
      <H6 testID="h6">
        <RNText>Heading six</RNText>
      </H6>
      <Title testID="title">
        <RNText>Title</RNText>
      </Title>
      <Subtitle testID="subtitle">
        <RNText>Subtitle</RNText>
      </Subtitle>
      <P testID="paragraph">
        <RNText>Paragraph</RNText>
      </P>
      <Lead testID="lead">
        <RNText>Lead</RNText>
      </Lead>
      <Large testID="large">
        <RNText>Large</RNText>
      </Large>
      <Small testID="small">
        <RNText>Small</RNText>
      </Small>
      <Muted testID="muted">
        <RNText>Muted</RNText>
      </Muted>
      <Blockquote testID="blockquote">
        <RNText>Quoted text</RNText>
      </Blockquote>
    </TypographyScope>
  );
  return (
    <BloomThemeProvider>
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{text}</BloomScope> : text}
      </BloomScope>
    </BloomThemeProvider>
  );
}

function metrics(screen: ReturnType<typeof render>) {
  const texts = Object.fromEntries(
    TEXT_PARTS.map((id) => {
      const style = resolvedStyle(screen.getByTestId(id).props.style);
      return [id, [style.fontSize, style.lineHeight, style.fontWeight, style.letterSpacing]];
    }),
  );
  const quote = resolvedStyle(screen.getByTestId('blockquote').props.style);
  return {
    texts,
    quote: [quote.marginTop, quote.paddingLeft],
  };
}

it('keeps semantic typography independent from Bloom control scopes', () => {
  const screen = render(<Subject />);
  const desktopMetrics = metrics(screen);
  screen.rerender(<Subject scope="xs" />);
  expect(metrics(screen)).toEqual(desktopMetrics);
  screen.rerender(<Subject scope="lg" />);
  expect(metrics(screen)).toEqual(desktopMetrics);
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(metrics(screen)).toEqual(desktopMetrics);
});

it('keeps TypographyScope scale as a separate axis from BloomScope', () => {
  const screen = render(<Subject scope="xs" typographyScale="desktop" />);
  const desktopBody = metrics(screen).texts.text;
  screen.rerender(<Subject scope="xs" typographyScale="default" />);
  const defaultBody = metrics(screen).texts.text;
  expect(defaultBody).not.toEqual(desktopBody);
  screen.rerender(<Subject scope="lg" typographyScale="desktop" />);
  expect(metrics(screen).texts.text).toEqual(desktopBody);
});
