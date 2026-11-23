import { AvatarAnchor, AvatarFlightLayer, useAvatarFlights } from '@oxy.so/bloom/avatar-flight';
import { Text } from '@oxy.so/bloom/typography';
import { View } from 'react-native';

import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

/** A thread's participants and the reply they land on, at rest (no flight in the air). */
const LanguageThread = L.view(() => {
  const flights = useAvatarFlights();
  return L.VStack(
    L.AvatarAnchor(flights, 'ada', L.Text('Ada')),
    L.AvatarAnchor(flights, 'reply', L.Text('Reply')),
    L.AvatarFlightLayer(flights),
  );
});

function BloomThread() {
  const flights = useAvatarFlights();
  return (
    <View>
      <AvatarAnchor flights={flights} anchor="ada">
        <Text>Ada</Text>
      </AvatarAnchor>
      <AvatarAnchor flights={flights} anchor="reply">
        <Text>Reply</Text>
      </AvatarAnchor>
      <AvatarFlightLayer flights={flights} />
    </View>
  );
}

const LanguageAnchor = L.view(() =>
  L.AvatarAnchor(useAvatarFlights(), 'ada', L.Text('Ada')).frame({ width: '44', height: '44' }),
);

function BloomAnchor() {
  return (
    <AvatarAnchor flights={useAvatarFlights()} anchor="ada" style={{ width: 44, height: 44 }}>
      <Text>Ada</Text>
    </AvatarAnchor>
  );
}

export const AVATAR_FLIGHT_CASES: readonly ParityCase[] = [
  {
    name: 'an anchor',
    language: () => toElement(LanguageAnchor()),
    bloom: () => <BloomAnchor />,
  },
  {
    name: 'anchors and their layer, at rest',
    language: () => toElement(LanguageThread()),
    bloom: () => <BloomThread />,
  },
];
