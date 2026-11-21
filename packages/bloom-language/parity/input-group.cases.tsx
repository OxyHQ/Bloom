import { Button } from '@oxy.so/bloom/button';
import { RiSearchLine } from '@oxy.so/bloom/icons';
import { InputGroup, InputGroupAddon } from '@oxy.so/bloom/input-group';
import { TextFieldInput } from '@oxy.so/bloom/text-field';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};

export const INPUT_GROUP_CASES: readonly ParityCase[] = [
  {
    name: 'a domain between two text addons',
    language: () =>
      toElement(
        L.InputGroup(
          L.InputGroupAddon('https://'),
          L.TextField(['', set], 'Domain').placeholder('oxy'),
          L.InputGroupAddon('.so'),
        ),
      ),
    bloom: () => (
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <TextFieldInput label="Domain" value="" onValueChange={set} placeholder="oxy" />
        <InputGroupAddon>.so</InputGroupAddon>
      </InputGroup>
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `a ${size} group with a button behind a divider`,
    language: () =>
      toElement(
        L.InputGroup(
          L.TextField(['ana@oxy.so', set], 'Invite'),
          L.InputGroupAddon(L.Button(L.Text('Send')).size('sm').style('subtle').tint('accent'))
            .divider()
            .flush(),
        ).size(size),
      ),
    bloom: () => (
      <InputGroup size={size}>
        <TextFieldInput label="Invite" value="ana@oxy.so" onValueChange={set} />
        <InputGroupAddon divider noPadding>
          <Button size="sm" appearance="subtle" tone="accent">
            Send
          </Button>
        </InputGroupAddon>
      </InputGroup>
    ),
  })),
  {
    name: 'a leading icon, invalid',
    language: () =>
      toElement(
        L.InputGroup(
          L.InputGroupAddon(L.Icon(RiSearchLine).foreground('muted')),
          L.TextField(['', set], 'Search'),
        ).invalid(),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <InputGroup invalid>
            <InputGroupAddon>
              <RiSearchLine fill={c.textSecondary} />
            </InputGroupAddon>
            <TextFieldInput label="Search" value="" onValueChange={set} />
          </InputGroup>
        )}
      </Themed>
    ),
  },
  {
    name: 'a disabled group with a box of its own',
    language: () =>
      toElement(
        L.InputGroup(L.InputGroupAddon('@'), L.TextField(['', set], 'Handle'))
          .disabled()
          .padding('sm')
          .testID('handle'),
      ),
    bloom: () => (
      <InputGroup
        disabled
        testID="handle"
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
      >
        <InputGroupAddon>@</InputGroupAddon>
        <TextFieldInput label="Handle" value="" onValueChange={set} />
      </InputGroup>
    ),
  },
  {
    name: 'an addon of its own box and test id, without a divider',
    language: () =>
      toElement(
        L.InputGroup(
          L.TextField(['12', set], 'Amount'),
          L.InputGroupAddon('EUR').divider(false).padding('xs').testID('currency'),
        ),
      ),
    bloom: () => (
      <InputGroup>
        <TextFieldInput label="Amount" value="12" onValueChange={set} />
        <InputGroupAddon
          divider={false}
          testID="currency"
          style={{ paddingTop: 4, paddingBottom: 4, paddingStart: 4, paddingEnd: 4 }}
        >
          EUR
        </InputGroupAddon>
      </InputGroup>
    ),
  },
];
