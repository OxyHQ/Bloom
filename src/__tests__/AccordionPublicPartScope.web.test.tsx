/** @jest-environment jsdom */
import { act } from 'react';
import type { ComponentProps } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../icons/remix/RiArrowDownSLine', () => ({ RiArrowDownSLine: () => <span /> }));

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../accordion/Accordion.web';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(_target: Element) {
    this.callback([], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
};

function Subject({
  size,
  outerSize,
  nested,
}: {
  size?: 'xs' | 'sm' | 'lg';
  outerSize?: 'xs' | 'lg';
  nested?: boolean;
}) {
  const accordion = (
    <Accordion size={size} value="details" onValueChange={() => {}}>
      <AccordionItem value="details">
        {/* biome-ignore lint/correctness/noReactNativeRawText: AccordionTrigger wraps string children in Bloom Text. */}
        <AccordionTrigger>Details</AccordionTrigger>
        <AccordionContent>
          <Text>Body</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
  return (
    <BloomThemeProvider fonts={false}>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{accordion}</BloomScope>
        </BloomScope>
      ) : outerSize ? (
        <BloomScope size={outerSize}>{accordion}</BloomScope>
      ) : (
        accordion
      )}
    </BloomThemeProvider>
  );
}

it('maps inherited, nested and explicit size onto the web trigger and content', () => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const renderSubject = (props?: ComponentProps<typeof Subject>) =>
      act(() => root.render(<Subject {...props} />));
    const measure = () => {
      const trigger = host.querySelector<HTMLButtonElement>('.bloom-accordion-trigger');
      const content = host.querySelector<HTMLElement>('.bloom-accordion-body');
      if (!trigger || !content) throw new Error('Accordion trigger or content did not render');
      return {
        trigger: {
          fontSize: trigger.style.getPropertyValue('--bloom-accordion-font-size'),
          paddingY: trigger.style.getPropertyValue('--bloom-accordion-padding-y'),
          gap: trigger.style.getPropertyValue('--bloom-accordion-gap'),
          minHeight: trigger.style.getPropertyValue('--bloom-accordion-min-height'),
        },
        contentRecipe: Array.from(content.classList).find((name) =>
          name.startsWith('bloom-accordion-body--'),
        ),
      };
    };

    renderSubject();
    const defaultSize = measure();
    expect(defaultSize).toEqual({
      trigger: { fontSize: '15px', paddingY: '12px', gap: '8px', minHeight: '0px' },
      contentRecipe: 'bloom-accordion-body--md',
    });
    renderSubject({ outerSize: 'xs' });
    expect(measure()).toEqual({
      trigger: { fontSize: '12px', paddingY: '8px', gap: '6px', minHeight: '0px' },
      contentRecipe: 'bloom-accordion-body--xs',
    });
    renderSubject({ nested: true });
    expect(measure()).toEqual({
      trigger: { fontSize: '17px', paddingY: '14px', gap: '10px', minHeight: '0px' },
      contentRecipe: 'bloom-accordion-body--lg',
    });
    renderSubject({ outerSize: 'lg', size: 'sm' });
    expect(measure()).toEqual({
      trigger: { fontSize: '13px', paddingY: '10px', gap: '8px', minHeight: '0px' },
      contentRecipe: 'bloom-accordion-body--sm',
    });
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
