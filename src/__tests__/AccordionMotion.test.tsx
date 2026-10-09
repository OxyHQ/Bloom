import React from 'react';
import { Animated, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';
import type { AccordionTransition } from '../accordion';

let mockReduced = false;
jest.mock('../hooks/use-prefers-reduced-motion', () => ({ usePrefersReducedMotion: () => mockReduced }));
const ui = (open: boolean, transition?: AccordionTransition) => <BloomThemeProvider>
  <Accordion value={open ? 'a' : undefined} onValueChange={() => {}} transition={transition}>
    <AccordionItem value="a"><AccordionTrigger>Details</AccordionTrigger><AccordionContent><Text>Inside</Text></AccordionContent></AccordionItem>
  </Accordion>
</BloomThemeProvider>;
afterEach(() => { mockReduced = false; jest.restoreAllMocks(); });

it('links native trigger and panel and hides mounted collapsed content from accessibility', () => {
  const api = render(ui(false));
  const trigger = api.UNSAFE_root.findAll(node => node.props.accessibilityRole === 'button')[0]!;
  const panel = api.UNSAFE_root.findAll(node => node.props.nativeID === trigger.props['aria-controls'] && node.props['aria-hidden'] === true)[0]!;
  expect(panel.props['aria-labelledby']).toBe(trigger.props.nativeID);
  expect(panel.props.accessibilityElementsHidden).toBe(true);
  expect(panel.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(api.queryByText('Inside')).toBeNull();
  expect(api.getByText('Inside', { includeHiddenElements: true })).toBeTruthy();
  api.rerender(ui(true));
  expect(api.getByText('Inside')).toBeTruthy();
  expect(api.UNSAFE_root.findAll(node => node.props.accessibilityRole === 'button')[0]!.props['aria-expanded']).toBe(true);
});

it('keeps the existing two spring recipes unless a timing transition is supplied', () => {
  const spring = jest.spyOn(Animated, 'spring'); const timing = jest.spyOn(Animated, 'timing');
  const api = render(ui(false));
  expect(spring.mock.calls.map(([, config]) => config)).toEqual(expect.arrayContaining([
    expect.objectContaining({ friction: 8, tension: 100, toValue: 0 }),
    expect.objectContaining({ friction: 8, tension: 60, toValue: 0 }),
  ]));
  expect(timing).not.toHaveBeenCalled();
  spring.mockClear();
  api.rerender(ui(true, { duration: 250, easing: [.23, 1, .32, 1] }));
  expect(spring).not.toHaveBeenCalled();
  expect(timing).toHaveBeenCalledTimes(2);
  for (const [, config] of timing.mock.calls) expect(config).toMatchObject({ duration: 250, toValue: 1, easing: expect.any(Function) });
});

it('settles without animation under reduced motion and stops active motion when the preference changes live', () => {
  const stop = jest.fn();
  const spring = jest.spyOn(Animated, 'spring').mockImplementation(() => ({ start: () => {}, stop, reset: () => {} }));
  const timing = jest.spyOn(Animated, 'timing');
  const setValue = jest.spyOn(Animated.Value.prototype, 'setValue');
  const api = render(ui(true));
  expect(spring).toHaveBeenCalledTimes(2);
  mockReduced = true; spring.mockClear();
  api.rerender(ui(true));
  expect(stop).toHaveBeenCalledTimes(2);
  expect(setValue.mock.calls.slice(-2)).toEqual([[1], [1]]);
  expect(spring).not.toHaveBeenCalled(); expect(timing).not.toHaveBeenCalled();
  api.rerender(ui(false));
  expect(setValue.mock.calls.slice(-2)).toEqual([[0], [0]]);
});
