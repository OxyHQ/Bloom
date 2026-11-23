import { Text } from 'react-native';
import { AspectRatio } from '@bloom/aspect-ratio';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'AspectRatio default': () => <AspectRatio testID="square" />,
  'AspectRatio video with style': () => (
    <AspectRatio ratio={16 / 9} style={{ width: 96, borderRadius: 12 }} testID="video">
      <Text>Media</Text>
    </AspectRatio>
  ),
};
