import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';
import { resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function openAccordion(): React.ReactElement {
  return (
    <Accordion type="single" value="a" onValueChange={() => {}}>
      <AccordionItem value="a">
        <AccordionTrigger>Open</AccordionTrigger>
        <AccordionContent>
          <View testID="body">
            <Text>body</Text>
          </View>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// The reveal used to interpolate to a hardcoded 500 ("reasonable max"), under an
// `overflow: hidden`. That is not a maximum, it is a CLIP: content taller than
// 500 lost its bottom, silently, with no error and no scrollbar. The height is
// measured now.
//
// What jest can see is the wiring: the content reports its own height, and the
// clip is withheld from an open item until that measurement arrives. What it
// CANNOT see is the interpolated pixel value — the repo-wide react-native mock
// exposes no `__getValue()` on an interpolation — nor whether anything is
// actually clipped, which is a layout fact. Measured instead in a real foreground
// Chromium on 2026-08-14, same probe both ways: an item holding 900px of content
// renders its clip 912px tall open (900 + the content padding) and 0 shut. With
// the constant restored, the identical probe reported 500 — 412px of the content
// gone, with no error and no scrollbar.
describe('Accordion content is sized by its content, not by a constant', () => {
  it('wires the content to report its own height', () => {
    const { UNSAFE_root } = renderWithTheme(openAccordion());
    const withLayout = UNSAFE_root.findAll(
      (node) =>
        typeof node.props.onLayout === 'function' &&
        resolvedStyle(node.props.style).paddingBottom != null,
    );
    expect(withLayout.length).toBeGreaterThan(0);
  });

  it('never clips or caps an open item at rest', () => {
    // Clipping to an un-measured 0 would hide an open item outright, and a cap once measured
    // would cut what grows or overflows it. Open and settled, the item has no constraint; it
    // takes one only while it moves.
    const { UNSAFE_root } = renderWithTheme(openAccordion());
    expect(
      UNSAFE_root.findAll((node) => resolvedStyle(node.props.style).overflow === 'hidden'),
    ).toHaveLength(0);
  });
});

// RN's `flex: 1` is `flexBasis: 0`. In a shrink-wrapped trigger (Services puts
// its "Having trouble?" trigger at `alignSelf: 'center'`) Yoga sized a
// zero-basis label at its MINIMUM content width, so the label wrapped to
// "Having / trouble?" on Android while web kept one line. The label box has to
// grow into a full-width trigger yet measure from its content.
describe('AccordionTrigger label box', () => {
  it('grows and shrinks from its content size, never from a zero basis', () => {
    const { getByTestId } = renderWithTheme(openAccordion());
    const style = resolvedStyle(getByTestId('accordion-trigger-label').props.style);
    expect(style).toMatchObject({ flexGrow: 1, flexShrink: 1 });
    expect(style.flex).toBeUndefined();
    expect(style.flexBasis).toBeUndefined();
  });
});
