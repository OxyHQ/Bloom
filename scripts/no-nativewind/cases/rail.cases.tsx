import { Text } from 'react-native';
import { RiHome5Line } from '@bloom/icons/remix/RiHome5Line';
import { Rail } from '@bloom/rail';
import type { Cases } from '../support/cases';

const icon = <RiHome5Line width={24} height={24} />;

export const CASES: Cases = {
  'Rail plain': () => (
    <Rail
      items={[
        { id: 'home', label: 'Home', icon },
        { id: 'chat', label: 'Chat', icon },
      ]}
      activeId="none"
      onSelect={() => {}}
    />
  ),
  'Rail loaded': () => (
    <Rail
      items={[
        { id: 'home', label: 'Home', icon, activeIcon: icon },
        { id: 'chat', label: 'Chat', icon },
      ]}
      activeId="home"
      onSelect={() => {}}
      width={96}
      header={<Text>Logo</Text>}
      footer={<Text>Me</Text>}
      testID="rail"
    />
  ),
};
