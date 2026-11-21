import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@oxy.so/bloom/accordion';
import { RiAddLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};

const items = () => [
  L.AccordionItem(
    'shipping',
    L.AccordionTrigger('Shipping'),
    L.AccordionContent(L.Text('Ships in 2 days.')),
  ),
  L.AccordionItem(
    'returns',
    L.AccordionTrigger('Returns'),
    L.AccordionContent(L.Text('30 days.')),
  ).disabled(),
];
const bloomItems = () => [
  <AccordionItem key="shipping" value="shipping">
    <AccordionTrigger>Shipping</AccordionTrigger>
    <AccordionContent>
      <Text>Ships in 2 days.</Text>
    </AccordionContent>
  </AccordionItem>,
  <AccordionItem key="returns" value="returns" disabled>
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>
      <Text>30 days.</Text>
    </AccordionContent>
  </AccordionItem>,
];

export const ACCORDION_CASES: readonly ParityCase[] = [
  {
    name: 'an accordion, nothing open',
    language: () => toElement(L.Accordion([undefined, set], ...items())),
    bloom: () => (
      <Accordion value={undefined} onValueChange={set}>
        {bloomItems()}
      </Accordion>
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} accordion, one open`,
    language: () => toElement(L.Accordion(['shipping', set], ...items()).size(size)),
    bloom: () => (
      <Accordion value="shipping" onValueChange={set} size={size}>
        {bloomItems()}
      </Accordion>
    ),
  })),
  {
    name: 'several open, a spring, padded',
    language: () =>
      toElement(
        L.Accordion([['shipping', 'returns'], set], ...items())
          .allowsMultiple()
          .revealMotion('spring')
          .padding('sm')
          .testID('faq'),
      ),
    bloom: () => (
      <Accordion
        value={['shipping', 'returns']}
        onValueChange={set}
        type="multiple"
        transition="spring"
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
        testID="faq"
      >
        {bloomItems()}
      </Accordion>
    ),
  },
  {
    name: 'a timed reveal, a trigger view and an indicator of its own',
    language: () =>
      toElement(
        L.Accordion(
          ['a', set],
          L.AccordionItem(
            'a',
            L.AccordionTrigger(L.Text('Details').weight('semibold')).indicator(L.Icon(RiAddLine)),
            L.AccordionContent(L.Text('More.')),
          ),
        ).revealMotion({ duration: 300 }),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <Accordion value="a" onValueChange={set} transition={{ duration: 300 }}>
            <AccordionItem value="a">
              <AccordionTrigger icon={<RiAddLine size="md" fill={c.text} />}>
                <Text style={{ fontWeight: '600' }}>Details</Text>
              </AccordionTrigger>
              <AccordionContent>
                <Text>More.</Text>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </Themed>
    ),
  },
];
