// Chrome that has to be the colour of the surface it sits on: a tab bar, a skeleton's ring.
import { Card } from '@oxy.so/bloom/card';
import { useSurfaceFill } from '@oxy.so/bloom/styles';
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';

export function TabBarBacking() {
  const surfaceFill = useSurfaceFill();
  return (
    <View className="flex-row gap-2 px-4" style={{ backgroundColor: surfaceFill }}>
      <Text style={{ color: surfaceFill }}>Posts</Text>
    </View>
  );
}

export function InCard() {
  const fill = useSurfaceFill();
  return (
    <Card>
      <View style={{ backgroundColor: fill }} />
    </Card>
  );
}
