import { Text } from 'react-native';
import { ConcentricView } from '@bloom/concentric';
import { Surface } from '@bloom/surface';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Surface default': () => (
    <Surface testID="s" style={{ padding: 12 }}>
      <Text>Body</Text>
    </Surface>
  ),
  'Surface radius and fill': () => (
    <Surface radius={8} fill="#336699" rim={false} sheen={false}>
      <Text>Body</Text>
    </Surface>
  ),
  'Surface concentric chain': () => (
    <Surface radius={24} style={{ padding: 8 }}>
      <Surface radius="concentric" style={{ padding: 4 }}>
        <ConcentricView radius="concentric" style={{ padding: 2 }}>
          <Text>Inner</Text>
        </ConcentricView>
      </Surface>
    </Surface>
  ),
  'ConcentricView radii': () => (
    <ConcentricView radius={{ topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 }}>
      <ConcentricView style={{ margin: 3 }} />
      <ConcentricView reset radius={6} />
    </ConcentricView>
  ),
};
