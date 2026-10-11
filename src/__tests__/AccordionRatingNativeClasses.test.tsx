import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';
import { RatingBar } from '../rating';
import { Meter } from '../stat-bar';
import { resolvedStyle } from './support/rendered-style';
jest.mock('react-native', () => ({
  ...jest.requireActual('../../__mocks__/react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () =>
  jest.requireActual('../../node_modules/react-native-css/dist/commonjs/native-internal/index.js'),
);
beforeEach(() => {
  StyleCollection.styles.clear();
  StyleCollection.inject(
    compile(`
    .root { gap:8px; width:360px; }
    .item { border-bottom-color:#5433eb; }
    .trigger { padding:16px 0; font-size:18px; }
    .panel { background-color:#eef0f1; }
    .body { padding:0 0 16px; }
    .label { font-size:10px; font-weight:600; color:#121212; }
    .track { height:8px; background-color:#eef0f1; }
    .fill { width:100%; background-color:#121212; }
  `).stylesheet(),
  );
});
it('resolves Accordion classes after native defaults on each actual host and the measured body', () => {
  const api = render(
    <BloomThemeProvider>
      <Accordion value="a" onValueChange={() => {}} className="root" testID="root">
        <AccordionItem value="a" className="item">
          <AccordionTrigger className="trigger">Details</AccordionTrigger>
          <AccordionContent className="panel" contentClassName="body">
            <View testID="body" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(api.getByTestId('root').props.style)).toMatchObject({ gap: 8, width: 360 });
  expect(
    resolvedStyle(
      api.UNSAFE_root.findAll((node) => node.props.accessibilityRole === 'button')[0]!.props.style,
    ),
  ).toMatchObject({ paddingTop: 16, paddingBottom: 16, paddingLeft: 0, paddingRight: 0 });
  expect(resolvedStyle(api.getByText('Details').props.style).fontSize).toBe(18);
  const views = api.UNSAFE_getAllByType(View);
  expect(
    views.some((node) => resolvedStyle(node.props.style).borderBottomColor === '#5433eb'),
  ).toBe(true);
  expect(
    api.UNSAFE_root.findAll((node) => resolvedStyle(node.props.style).backgroundColor === '#eef0f1')
      .length,
  ).toBeGreaterThan(0);
  const body = views.find((node) => typeof node.props.onLayout === 'function');
  expect(resolvedStyle(body?.props.style)).toMatchObject({
    paddingBottom: 16,
    paddingLeft: 0,
    paddingRight: 0,
  });
});
it('delegates RatingBar track and fill classes to Meter while keeping the fill fraction data-owned', () => {
  const api = render(
    <BloomThemeProvider>
      <RatingBar
        label="Five"
        display="75%"
        value={0.75}
        max={1}
        labelWidth={16}
        testID="row"
        className="root"
        labelClassName="label"
        displayClassName="label"
        trackClassName="track"
        fillClassName="fill"
      />
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(api.getByTestId('row').props.style).gap).toBe(8);
  expect(resolvedStyle(api.getByTestId('row-bar').props.style)).toMatchObject({
    height: 8,
    backgroundColor: '#eef0f1',
  });
  expect(resolvedStyle(api.getByTestId('row-fill').props.style)).toMatchObject({
    width: '75%',
    backgroundColor: '#121212',
  });
  for (const label of ['Five', '75%'])
    expect(
      resolvedStyle(api.getByText(label, { includeHiddenElements: true }).props.style),
    ).toMatchObject({ fontSize: 10, fontWeight: 600, color: '#121212' });
});
it('keeps direct Meter defaults and semantic values while its classes customize paint and height', () => {
  const api = render(
    <BloomThemeProvider>
      <Meter
        value={2}
        max={4}
        accessibilityLabel="Progress"
        testID="meter"
        className="track"
        fillClassName="fill"
      />
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(api.getByTestId('meter').props.style)).toMatchObject({
    height: 8,
    backgroundColor: '#eef0f1',
  });
  expect(api.getByTestId('meter').props['aria-valuenow']).toBe(2);
  expect(resolvedStyle(api.getByTestId('meter-fill').props.style)).toMatchObject({
    width: '50%',
    backgroundColor: '#121212',
  });
});
it('resolves Collapsible wrapper and content classes on their native owning nodes', () => {
  const { Collapsible } = require('../collapsible/Collapsible');
  const api = render(
    <Collapsible open testID="collapse" className="root panel" contentClassName="body">
      <View />
    </Collapsible>,
  );
  expect(resolvedStyle(api.getByTestId('collapse').props.style)).toMatchObject({
    gap: 8,
    width: 360,
    backgroundColor: '#eef0f1',
  });
  const body = api
    .UNSAFE_getAllByType(View)
    .find((node) => typeof node.props.onLayout === 'function');
  expect(resolvedStyle(body?.props.style)).toMatchObject({
    paddingBottom: 16,
    paddingLeft: 0,
    paddingRight: 0,
  });
});
