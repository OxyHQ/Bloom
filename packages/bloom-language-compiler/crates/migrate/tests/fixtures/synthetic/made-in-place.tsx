// A modifier made in place (in a table, or returned by a function) is a modifier value; a list
// pattern with defaults reads each element as JS does past the end; a generic function keeps its
// type parameters.
import { Text, defineModifier, view, type ViewModifier } from '@oxy.so/bloom-language';

const padding = {
  default: defineModifier((v) => v.padding('lg')),
  compact: defineModifier((v) => v.padding('md')),
};

function nudged(y: 'xs' | 'sm'): ViewModifier {
  return defineModifier((v) => v.offset({ y }));
}

function amount(value: string): string {
  const [whole = '0', fraction = ''] = value.split('.');
  return `${whole},${fraction}`;
}

export function firstOf<T>(values: T[], fallback: T): T {
  return values.length > 0 ? values[0] : fallback;
}

export const Price = view(function Price({ value, compact }: { value: string; compact: boolean }) {
  return Text(amount(value))
    .modifier(padding[compact ? 'compact' : 'default'])
    .modifier(nudged('xs'));
});
