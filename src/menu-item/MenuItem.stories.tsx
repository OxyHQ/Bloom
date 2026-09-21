import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { BottomSheet } from '../bottom-sheet';
import { Card, CardBody } from '../card';
import { Divider } from '../divider';
import { Text } from '../typography';
import { MenuItemOptions } from './MenuItemOptions';
import { MenuItemRow } from './MenuItemRow';
import type { MenuItemOptionGroup, MenuItemRowProps } from './types';

const meta: Meta = {
  title: 'Blocks/Food/MenuItem',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
//  Demo data — invented dishes.
// ---------------------------------------------------------------------------

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/320/320`;

type Dish = MenuItemRowProps & { id: string };

const DISHES: Dish[] = [
  {
    id: 'ember',
    name: 'Ember flatbread',
    description:
      'Wood-fired base, slow-roasted tomato, torn basil and a smoked curd we make on the premises.',
    price: '€12.50',
    photo: photo('ember-flatbread'),
    diets: ['vegetarian'],
  },
  {
    id: 'sorrel',
    name: 'Sorrel and white bean stew',
    description: 'Slow beans, sorrel, olive oil, a slice of yesterday’s bread.',
    price: '€10.00',
    originalPrice: '€13.00',
    photo: photo('sorrel-stew'),
    diets: ['vegan', 'gluten-free'],
    spice: 1,
  },
  {
    id: 'kestrel',
    name: 'Kestrel chilli noodles',
    description: 'Hand-pulled noodles, fermented chilli, peanuts, spring onion.',
    price: '€13.80',
    photo: photo('chilli-noodles'),
    diets: ['vegan'],
    spice: 3,
  },
  {
    id: 'harbour',
    name: 'Harbour pickles',
    description: 'A small plate of whatever came in that morning.',
    price: '€4.20',
    photo: photo('harbour-pickles'),
    diets: ['vegan', 'gluten-free', 'halal'],
    unavailable: true,
  },
];

const GROUPS: MenuItemOptionGroup[] = [
  {
    id: 'size',
    title: 'Size',
    min: 1,
    max: 1,
    options: [
      { id: 'regular', label: 'Regular', price: 'Included' },
      { id: 'large', label: 'Large', description: 'Serves two', price: '+€4.00' },
    ],
  },
  {
    id: 'extras',
    title: 'Extras',
    max: 3,
    options: [
      { id: 'curd', label: 'Extra smoked curd', price: '+€1.50' },
      { id: 'chilli', label: 'Fermented chilli', price: '+€0.80' },
      { id: 'olives', label: 'Green olives', price: '+€1.20' },
      { id: 'anchovy', label: 'Anchovy', price: '+€2.00' },
      { id: 'truffle', label: 'Truffle oil', price: '+€3.50', disabled: true },
    ],
  },
  {
    id: 'sauce',
    title: 'Sauce on the side',
    max: 1,
    options: [
      { id: 'none', label: 'None' },
      { id: 'garlic', label: 'Garlic', price: '+€0.60' },
      { id: 'chilli-oil', label: 'Chilli oil', price: '+€0.60' },
    ],
  },
];

function Page({ children }: { children: React.ReactNode }) {
  return <View style={{ width: '100%', paddingVertical: 16, gap: 32, maxWidth: 760 }}>{children}</View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text variant="caption-1-semibold" style={{ opacity: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Menu({ density }: { density?: MenuItemRowProps['density'] }) {
  const [basket, setBasket] = useState<Record<string, number>>({ ember: 2 });
  return (
    <Card variant="plain" radius="radius-16">
      <CardBody style={{ padding: 0 }}>
        {DISHES.map((dish, index) => {
          const { id, ...rest } = dish;
          const quantity = basket[id] ?? 0;
          return (
            <React.Fragment key={id}>
              {index > 0 ? <Divider /> : null}
              <MenuItemRow
                {...rest}
                density={density}
                quantity={quantity}
                onQuantityChange={
                  quantity > 0
                    ? (next: number) => setBasket((b) => ({ ...b, [id]: next }))
                    : undefined
                }
                onAdd={dish.unavailable ? undefined : () => setBasket((b) => ({ ...b, [id]: 1 }))}
                onPress={() => undefined}
                testID={`dish-${id}`}
              />
            </React.Fragment>
          );
        })}
      </CardBody>
    </Card>
  );
}

/** A menu section: rows in a card, separated by hairlines. */
export const Menu_: Story = {
  name: 'Menu',
  render: () => (
    <Page>
      <Section title="Wood oven">
        <Menu />
      </Section>
      <Section title="Compact — the basket rung">
        <Menu density="compact" />
      </Section>
    </Page>
  ),
};

/** Every state one row has. */
export const RowStates: Story = {
  render: function RowStatesStory() {
    const [n, setN] = useState(2);
    return (
      <Page>
        <Section title="Nothing in the basket, something in it, sold out, no photo, long text">
          <Card variant="plain" radius="radius-16">
            <CardBody style={{ padding: 0 }}>
              <MenuItemRow
                name="Ember flatbread"
                description="Wood-fired base, slow-roasted tomato, torn basil."
                price="€12.50"
                photo={photo('ember-flatbread')}
                diets={['vegetarian']}
                onAdd={() => undefined}
                onPress={() => undefined}
                testID="row-rest"
              />
              <Divider />
              <MenuItemRow
                name="Kestrel chilli noodles"
                description="Hand-pulled noodles, fermented chilli, peanuts."
                price="€13.80"
                photo={photo('chilli-noodles')}
                diets={['vegan']}
                spice={3}
                quantity={n}
                onQuantityChange={setN}
                onPress={() => undefined}
                testID="row-stepper"
              />
              <Divider />
              <MenuItemRow
                name="Sorrel and white bean stew"
                description="Slow beans, sorrel, olive oil."
                price="€10.00"
                originalPrice="€13.00"
                photo={photo('sorrel-stew')}
                quantity={3}
                testID="row-badge"
              />
              <Divider />
              <MenuItemRow
                name="Harbour pickles"
                description="A small plate of whatever came in that morning."
                price="€4.20"
                photo={photo('harbour-pickles')}
                diets={['vegan', 'gluten-free']}
                unavailable
                onAdd={() => undefined}
                onPress={() => undefined}
                testID="row-unavailable"
              />
              <Divider />
              <MenuItemRow
                name="A dish with a name long enough that it has to be cut off somewhere"
                description="And a description that keeps going well past the two lines this row will give it, so the clamp has something to do and the price still has to land where it lands."
                price="€21.00"
                diets={['vegetarian', 'gluten-free', 'halal', 'kosher']}
                spice={2}
                onAdd={() => undefined}
                onPress={() => undefined}
                testID="row-long"
              />
            </CardBody>
          </Card>
        </Section>
      </Page>
    );
  },
};

function useOptionState() {
  const [value, setValue] = useState<Record<string, readonly string[]>>({
    size: ['regular'],
    extras: ['curd'],
  });
  const onValueChange = (groupId: string, ids: readonly string[]) =>
    setValue((current) => ({ ...current, [groupId]: ids }));
  const chosen = useMemo(() => Object.values(value).flat().length, [value]);
  return { value, onValueChange, chosen };
}

function DishHeader() {
  return (
    <View style={{ gap: 4 }}>
      <Text variant="title-3-semibold">Ember flatbread</Text>
      <Text variant="body-2-regular" style={{ opacity: 0.7 }}>
        Wood-fired base, slow-roasted tomato, torn basil and a smoked curd we make on the premises.
      </Text>
    </View>
  );
}

/** Choosing the dish: the groups, the rules, the quantity and the running price. */
export const Options: Story = {
  render: function OptionsStory() {
    const { value, onValueChange } = useOptionState();
    const [quantity, setQuantity] = useState(1);
    return (
      <Page>
        <Section title="Inline — what a desktop dialog holds">
          <Card variant="plain" radius="radius-16">
            <CardBody>
              <MenuItemOptions
                header={<DishHeader />}
                groups={GROUPS}
                value={value}
                onValueChange={onValueChange}
                quantity={quantity}
                onQuantityChange={setQuantity}
                total="€16.40"
                onSubmit={() => undefined}
                testID="options"
              />
            </CardBody>
          </Card>
        </Section>
      </Page>
    );
  },
};

/** A required group with nothing chosen: the rule, the asterisk and the error. */
export const OptionsInvalid: Story = {
  render: function OptionsInvalidStory() {
    const [value, setValue] = useState<Record<string, readonly string[]>>({});
    return (
      <Page>
        <Section title="Required, unanswered">
          <Card variant="plain" radius="radius-16">
            <CardBody>
              <MenuItemOptions
                groups={[
                  { ...GROUPS[0]!, error: 'Choose a size to carry on.' },
                  GROUPS[1]!,
                ]}
                value={value}
                onValueChange={(groupId, ids) =>
                  setValue((current) => ({ ...current, [groupId]: ids }))
                }
                total="€12.50"
                submitDisabled
                onSubmit={() => undefined}
                testID="options-invalid"
              />
            </CardBody>
          </Card>
        </Section>
      </Page>
    );
  },
};

/** The same content on a phone: a `BottomSheet` holds it, and it builds no sheet of its own. */
export const OptionsInASheet: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: function OptionsInASheetStory() {
    const { value, onValueChange } = useOptionState();
    const [quantity, setQuantity] = useState(1);
    return (
      <View style={{ height: 720 }}>
        <BottomSheet open onDismiss={() => undefined}>
          <View style={{ padding: 16, paddingBottom: 32 }}>
            <MenuItemOptions
              header={<DishHeader />}
              groups={GROUPS}
              value={value}
              onValueChange={onValueChange}
              quantity={quantity}
              onQuantityChange={setQuantity}
              total="€16.40"
              onSubmit={() => undefined}
              testID="options-sheet"
            />
          </View>
        </BottomSheet>
      </View>
    );
  },
};
