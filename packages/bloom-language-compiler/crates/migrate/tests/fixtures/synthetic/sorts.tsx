// JS's comparator sort of a copy (`[...xs].sort((a, b) => b.n - a.n)`) is Swift's `sorted`, the
// comparator's "a first" as a Bool; a TS value keeps JS's own `sort`.
import { Text, VStack, view } from '@oxy.so/bloom-language';

interface Point {
  label: string;
  value: number;
}

export const Peaks = view(function Peaks(props: { points: Point[] }) {
  const highest = [...props.points].sort((a, b) => b.value - a.value);
  const lowest = [...props.points].sort((a, b) => (a.value > b.value ? 1 : -1));
  return VStack(
    Text(highest.map((p) => p.label).join(', ')),
    Text(lowest.map((p) => p.label).join(', ')),
  );
});
