import { Button } from '@oxy.so/bloom/button';
import { RiInformationLine } from '@oxy.so/bloom/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@oxy.so/bloom/tooltip';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const set = () => {};
const trigger = () =>
  L.Button(L.Icon(RiInformationLine)).style('plain').shape('circle').label('About');
const bloomTrigger = () => (
  <Button appearance="plain" leadingIcon={RiInformationLine} iconOnly accessibilityLabel="About" />
);

export const TOOLTIP_CASES: readonly ParityCase[] = [
  {
    name: 'a hidden tooltip',
    language: () => toElement(L.Tooltip(trigger(), 'About this page').presented([false, set])),
    bloom: () => (
      <Tooltip visible={false} onVisibleChange={set}>
        <TooltipTrigger>{bloomTrigger()}</TooltipTrigger>
        <TooltipContent label="About this page">About this page</TooltipContent>
      </Tooltip>
    ),
  },
  ...ENUMS.tooltipSide.flatMap((side) =>
    ENUMS.tooltipSize.map((size) => ({
      name: `a ${size} tooltip shown on the ${side}`,
      language: () =>
        toElement(
          L.Tooltip(trigger(), 'About').presented([true, set]).side(side).size(size).openDelay(0),
        ),
      bloom: () => (
        <Tooltip visible onVisibleChange={set} position={side} delay={0}>
          <TooltipTrigger>{bloomTrigger()}</TooltipTrigger>
          <TooltipContent label="About" size={size}>
            About
          </TooltipContent>
        </Tooltip>
      ),
    })),
  ),
  {
    name: 'a tooltip of a view, named',
    language: () =>
      toElement(
        L.Tooltip(trigger(), L.Text('Saved').weight('semibold'))
          .presented([true, set])
          .label('Saved'),
      ),
    bloom: () => (
      <Tooltip visible onVisibleChange={set}>
        <TooltipTrigger>{bloomTrigger()}</TooltipTrigger>
        <TooltipContent label="Saved">
          <Text style={{ fontWeight: '600' }}>Saved</Text>
        </TooltipContent>
      </Tooltip>
    ),
  },
];
