import { HoverCard, HoverCardContent, HoverCardTrigger } from '@oxy.so/bloom/hover-card';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const ALIGNS = ['start', 'center', 'end'] as const;

const trigger = () => L.Text('@nate');
const card = () => L.Text('Building the Oxy ecosystem.');
const bloomTrigger = () => <Text>@nate</Text>;
const bloomCard = () => <Text>Building the Oxy ecosystem.</Text>;

export const HOVER_CARD_CASES: readonly ParityCase[] = [
  {
    name: 'a hover card',
    language: () => toElement(L.HoverCard(trigger(), card())),
    bloom: () => (
      <HoverCard>
        <HoverCardTrigger>{bloomTrigger()}</HoverCardTrigger>
        <HoverCardContent>{bloomCard()}</HoverCardContent>
      </HoverCard>
    ),
  },
  ...ENUMS.tooltipSide.flatMap((side) =>
    ALIGNS.map((align) => ({
      name: `an open hover card on the ${side}, aligned ${align}`,
      language: () =>
        toElement(
          L.HoverCard(trigger(), card())
            .presented([true, set])
            .side(side)
            .align(align)
            .label('Nate'),
        ),
      bloom: () => (
        <HoverCard open onOpenChange={set}>
          <HoverCardTrigger>{bloomTrigger()}</HoverCardTrigger>
          <HoverCardContent label="Nate" side={side} align={align}>
            {bloomCard()}
          </HoverCardContent>
        </HoverCard>
      ),
    })),
  ),
  {
    name: 'an open hover card with no surface of its own',
    language: () => toElement(L.HoverCard(trigger(), card()).presented([true, set]).padded(false)),
    bloom: () => (
      <HoverCard open onOpenChange={set}>
        <HoverCardTrigger>{bloomTrigger()}</HoverCardTrigger>
        <HoverCardContent padded={false}>{bloomCard()}</HoverCardContent>
      </HoverCard>
    ),
  },
  {
    name: 'a hover card with its delays, on a framed trigger',
    language: () =>
      toElement(
        L.HoverCard(trigger(), card())
          .presented([false, set])
          .openDelay(0)
          .closeDelay(300)
          .testID('author')
          .padding('xs'),
      ),
    bloom: () => (
      <HoverCard open={false} onOpenChange={set} openDelay={0} closeDelay={300}>
        <HoverCardTrigger
          testID="author"
          style={{ paddingTop: 4, paddingBottom: 4, paddingStart: 4, paddingEnd: 4 }}
        >
          {bloomTrigger()}
        </HoverCardTrigger>
        <HoverCardContent>{bloomCard()}</HoverCardContent>
      </HoverCard>
    ),
  },
  {
    name: 'a disabled hover card',
    language: () => toElement(L.HoverCard(trigger(), card()).disabled()),
    bloom: () => (
      <HoverCard>
        <HoverCardTrigger disabled>{bloomTrigger()}</HoverCardTrigger>
        <HoverCardContent>{bloomCard()}</HoverCardContent>
      </HoverCard>
    ),
  },
];
