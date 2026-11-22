import { Text } from 'react-native';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@bloom/accordion';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Accordion plain': () => (
    <Accordion value="a" onValueChange={() => {}}>
      <AccordionItem value="a">
        <AccordionTrigger>Details</AccordionTrigger>
        <AccordionContent>
          <Text>Body</Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b" disabled>
        <AccordionTrigger icon={<Text>i</Text>}>More</AccordionTrigger>
        <AccordionContent>
          <Text>More body</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  'Accordion sized and styled': () => (
    <Accordion
      type="multiple"
      size="lg"
      value={['a']}
      onValueChange={() => {}}
      style={{ width: 360 }}
      testID="acc"
    >
      <AccordionItem value="a" style={{ borderBottomColor: '#5433eb' }}>
        <AccordionTrigger style={{ paddingTop: 16 }} textStyle={{ fontSize: 18 }}>
          Details
        </AccordionTrigger>
        <AccordionContent style={{ backgroundColor: '#eef0f1' }}>
          <Text>Body</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
