import { HStack, Text } from '@oxy.so/bloom-language';

export function Hello() {
  return HStack(Text('x').font('body')).padding('md');
}
