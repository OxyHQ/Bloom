/** @jest-environment jsdom */
/* biome-ignore-all lint/correctness/noReactNativeRawText: Bloom typography components accept and render text children. */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
    <BloomThemeProvider fonts={false}>
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{text}</BloomScope> : text}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps semantic typography independent from Bloom control scopes in DOM web', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);
  const renderSubject = (props?: {
    scope?: BloomSize;
    nestedScope?: BloomSize;
    typographyScale?: TypographyScale;
  }) => act(() => root.render(<Subject {...props} />));
  const snapshot = () => {
    const texts = Object.fromEntries(
      TEXT_PARTS.map((id) => {
        const node = host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
        if (!node) throw new Error(`Typography fixture did not render ${id}`);
        const style = getComputedStyle(node);
        return [id, [style.fontSize, style.lineHeight, style.fontWeight, style.letterSpacing]];
      }),
    );
    const quote = host.querySelector<HTMLElement>('[data-testid="blockquote"]');
    if (!quote) throw new Error('Typography fixture did not render Blockquote');
    const quoteStyle = getComputedStyle(quote);
    return { texts, quote: [quoteStyle.marginTop, quoteStyle.paddingLeft] };
  };
  try {
    renderSubject();
    const desktopMetrics = snapshot();
    renderSubject({ scope: 'xs' });
    expect(snapshot()).toEqual(desktopMetrics);
    renderSubject({ scope: 'lg' });
    expect(snapshot()).toEqual(desktopMetrics);
    renderSubject({ scope: 'xs', nestedScope: 'lg' });
    expect(snapshot()).toEqual(desktopMetrics);
    renderSubject({ scope: 'xs', typographyScale: 'default' });
    const defaultBody = snapshot().texts.text;
    expect(defaultBody).not.toEqual(desktopMetrics.texts.text);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
