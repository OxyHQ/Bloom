import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';
import { resolvedStyle } from './support/rendered-style';
it('puts Accordion styles after native defaults on each actual host and the measured body', () => {
  const api = render(
    <BloomThemeProvider>
      <Accordion value="a" onValueChange={() => {}} style={{ gap: 8, width: 360 }} testID="root">
        <AccordionItem value="a" style={{ borderBottomColor: '#5433eb' }}>
          <AccordionTrigger
            style={{ paddingTop: 16, paddingBottom: 16, paddingLeft: 0, paddingRight: 0 }}
            textStyle={{ fontSize: 18 }}
          >
            Details
          </AccordionTrigger>
          <AccordionContent
            style={{ backgroundColor: '#eef0f1' }}
            contentStyle={{ paddingTop: 0, paddingRight: 0, paddingBottom: 16, paddingLeft: 0 }}
          >
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
it('puts Collapsible wrapper and content styles on their native owning nodes', () => {
  const { Collapsible } = require('../collapsible/Collapsible');
  const api = render(
    <Collapsible
      open
      testID="collapse"
      style={{ gap: 8, width: 360, backgroundColor: '#eef0f1' }}
      contentStyle={{ paddingTop: 0, paddingRight: 0, paddingBottom: 16, paddingLeft: 0 }}
    >
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
