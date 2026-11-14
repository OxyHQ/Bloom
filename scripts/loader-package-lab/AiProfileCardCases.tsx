import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AiProfileCard } from '@oxy.so/bloom/ai-profile-card';
import { Button } from '@oxy.so/bloom/button';
import { Text } from '@oxy.so/bloom/typography';

const STATS = [
  { value: '9B', label: 'Lifetime tokens' },
  { value: '562M', label: 'Peak tokens' },
  { value: '12h', label: 'Longest task' },
  { value: '62', label: 'Top streak' },
];
const CELLS = Array.from({ length: 38 * 7 }, (_, index) => ({
  count: index % 30,
  date: `Day ${index}`,
}));

export function AiProfileCardCases() {
  const [cardWidth, setCardWidth] = useState(390);
  return (
    <SafeAreaView style={{ flex: 1, minHeight: 0, backgroundColor: '#fff8fa' }}>
      <View style={{ gap: 4, padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Button
            size="sm"
            appearance={cardWidth === 390 ? 'solid' : 'outline'}
            testID="profile-card-width-narrow"
            onPress={() => setCardWidth(390)}
          >
            390px
          </Button>
          <Button
            size="sm"
            appearance={cardWidth === 700 ? 'solid' : 'outline'}
            testID="profile-card-width-wide"
            onPress={() => setCardWidth(700)}
          >
            700px
          </Button>
        </View>
        <Text testID="profile-card-width-value">Card width: {cardWidth}px</Text>
      </View>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16 }}>
        <View style={{ width: cardWidth, maxWidth: '100%' }}>
          <AiProfileCard
            testID="profile-card"
            name="Maya Collins"
            handle="@maya"
            badge="PRO"
            countUpDuration={0}
            contributions={7462}
            delta="+14.8%"
            stats={STATS}
            cells={CELLS}
            actions={<Button size="sm">Share</Button>}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
