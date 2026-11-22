import * as RN from 'react-native';
import { Button } from '@oxy.so/bloom/button';
import { RiShareLine } from '@oxy.so/bloom/icons';
import { Surface } from '@oxy.so/bloom/surface';
import { tokens } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';

import { defineEnvironment, useEnvironment } from '../src/environment';
import { defineModifier } from '../src/modifier';
import * as L from '../src/primitives';
import { toElement } from '../src/render';
import { view } from '../src/view';
import { type ParityCase, Themed } from './support/cases';

const onPress = () => {};
const { space, borderRadius } = tokens;

/** An app's own environment value, read by a view inside. */
const Compact = defineEnvironment('compact', false);
const Meta = view(function Meta({ label }: { label: string }) {
  const compact = useEnvironment(Compact);
  return compact ? L.Text(label) : L.Text(`${label}, in full`);
});

const environment: ParityCase[] = [
  {
    name: 'disabled reaches every control inside',
    language: () =>
      toElement(
        L.VStack(
          L.Button(L.Text('Save')),
          L.HStack(L.Button(L.Text('Cancel')).style('plain')),
        ).disabled(),
      ),
    bloom: () => (
      <RN.View>
        <Button disabled>Save</Button>
        <RN.View style={{ flexDirection: 'row' }}>
          <Button appearance="plain" disabled>
            Cancel
          </Button>
        </RN.View>
      </RN.View>
    ),
  },
  {
    name: 'a control’s own disabled(false) wins over the environment',
    language: () =>
      toElement(
        L.VStack(L.Button(L.Text('Save')).disabled(false), L.Button(L.Text('Cancel'))).disabled(),
      ),
    bloom: () => (
      <RN.View>
        <Button disabled={false}>Save</Button>
        <Button disabled>Cancel</Button>
      </RN.View>
    ),
  },
  {
    name: 'controlSize sizes every control that names none',
    language: () =>
      toElement(
        L.HStack(L.Button(L.Text('Day')), L.Button(L.Text('Week')).size('lg')).controlSize('sm'),
      ),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <Button size="sm">Day</Button>
        <Button size="lg">Week</Button>
      </RN.View>
    ),
  },
  {
    name: 'buttonStyle styles every Button that names none',
    language: () =>
      toElement(
        L.HStack(L.Button(L.Text('Edit')), L.Button(L.Text('Delete')).style('solid')).buttonStyle(
          'outline',
        ),
      ),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <Button appearance="outline">Edit</Button>
        <Button appearance="solid">Delete</Button>
      </RN.View>
    ),
  },
  {
    name: 'an app’s environment value reaches a view inside',
    language: () =>
      toElement(
        L.VStack(
          Meta({ label: 'Posted' }),
          L.VStack(Meta({ label: 'Edited' })).environment(Compact, true),
        ),
      ),
    bloom: () => (
      <RN.View>
        <Text>Posted, in full</Text>
        <RN.View>
          <Text>Edited</Text>
        </RN.View>
      </RN.View>
    ),
  },
];

/** The glass button styles: the button on glass (Bloom's shared material), as the chain they stand for draws it. */
const glassStyles: ParityCase[] = [
  {
    name: 'glass: a subtle neutral button on glass',
    language: () =>
      toElement(
        L.Button(L.Icon(RiShareLine))
          .shape('circle')
          .label('Share')
          .style('glass')
          .onPress(onPress),
      ),
    bloom: () => (
      <Surface>
        <Button
          appearance="subtle"
          tone="neutral"
          iconOnly
          leadingIcon={RiShareLine}
          accessibilityLabel="Share"
          material="shared"
          onPress={onPress}
        />
      </Surface>
    ),
  },
  {
    name: 'glassProminent: a solid accent button on glass tinted with its fill',
    language: () => toElement(L.Button(L.Text('Done')).style('glassProminent').onPress(onPress)),
    bloom: () => (
      <Themed>
        {(c) => (
          <Surface fill={c.primary}>
            <Button appearance="solid" tone="accent" material="shared" onPress={onPress}>
              Done
            </Button>
          </Surface>
        )}
      </Themed>
    ),
  },
  {
    name: 'glassProminent takes its tint',
    language: () => toElement(L.Button(L.Text('Delete')).style('glassProminent').tint('danger')),
    bloom: () => (
      <Themed>
        {(c) => (
          <Surface fill={c.error}>
            <Button appearance="solid" tone="danger" material="shared">
              Delete
            </Button>
          </Surface>
        )}
      </Themed>
    ),
  },
  {
    name: 'buttonStyle glass reaches every Button inside',
    language: () =>
      toElement(
        L.HStack(L.Button(L.Text('Bold')), L.Button(L.Text('Italic'))).buttonStyle('glass'),
      ),
    bloom: () => (
      <RN.View style={{ flexDirection: 'row' }}>
        <Surface>
          <Button appearance="subtle" tone="neutral" material="shared">
            Bold
          </Button>
        </Surface>
        <Surface>
          <Button appearance="subtle" tone="neutral" material="shared">
            Italic
          </Button>
        </Surface>
      </RN.View>
    ),
  },
];

/** A named recipe of modifiers, and one with an argument. */
const sectionCard = defineModifier((v) => v.padding('md').corner('xl'));
const inset = defineModifier((v, edge: 'horizontal' | 'vertical') => v.padding(edge, 'lg'));

const modifiers: ParityCase[] = [
  {
    name: 'a custom modifier is the chain it stands for',
    language: () => toElement(L.VStack(L.Text('Storage')).modifier(sectionCard)),
    bloom: () => (
      <RN.View
        style={{
          paddingTop: space.md,
          paddingBottom: space.md,
          paddingStart: space.md,
          paddingEnd: space.md,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
        }}
      >
        <Text>Storage</Text>
      </RN.View>
    ),
  },
  {
    name: 'a custom modifier takes its arguments',
    language: () => toElement(L.Text('Beta').modifier(inset, 'horizontal')),
    bloom: () => <Text style={{ paddingStart: space.lg, paddingEnd: space.lg }}>Beta</Text>,
  },
];

export const ENVIRONMENT_CASES: readonly ParityCase[] = [
  ...environment,
  ...glassStyles,
  ...modifiers,
];
