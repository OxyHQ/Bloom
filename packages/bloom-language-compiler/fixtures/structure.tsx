import { Text, VStack, clear, regular, toElement, view } from '@oxy.so/bloom-language';
import { useState } from 'react';

/** Conditionals, lists, presses, glass, and a view whose body re-renders around a static subtree. */
export const hoisted = 5;

export const press = { count: 0, bump: () => {} };

const Counter = view(function Counter(props: { label: string }) {
  const [count, setCount] = useState(0);
  press.bump = () => setCount((n) => n + 1);
  return VStack(
    Text('Static header').font('title-3').weight('bold'),
    Text(`${props.label} ${count}`),
  );
});

function Slots(show: boolean, items: string[]) {
  return VStack(
    show && Text('maybe'),
    items.map((item) => Text(item).id(item)),
    Counter({ label: 'kept' }),
  );
}

function Row(onPress: (() => void) | undefined) {
  return VStack(Text('row')).padding('vertical', 'md').hoverGroup().label('Row').onPress(onPress);
}

function Glass() {
  return VStack(
    VStack(Text('regular')).glass().corner('xl'),
    VStack(Text('tinted')).glass(regular.tint('primary', 'medium')),
    VStack(Text('clear')).glass(clear),
    VStack(Text('clear tint')).glass(clear.tint('error')).padding('md'),
  );
}

const handler = () => {};

export const cases = {
  slotsHidden: () => toElement(Slots(false, ['a', 'b'])),
  slotsShown: () => toElement(Slots(true, ['b', 'a', 'c'])),
  pressable: () => toElement(Row(handler)),
  inert: () => toElement(Row(undefined)),
  glass: () => toElement(Glass()),
};
