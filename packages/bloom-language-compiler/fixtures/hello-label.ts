import { HStack, Text } from '@oxy.so/bloom-language';

export function HelloLabel({ label }: { label: string }) {
  return HStack(Text(label).font('body')).padding('md');
}
