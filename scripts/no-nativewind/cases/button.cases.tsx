import { Text } from 'react-native';
import { RiAddLine } from '@bloom/icons/remix/RiAddLine';
import { Button } from '@bloom/button';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Button plain': () => <Button onPress={() => {}}>Save</Button>,
  'Button variants': () => (
    <>
      <Button appearance="outline" tone="neutral" size="sm" leadingIcon={RiAddLine}>
        Add
      </Button>
      <Button appearance="plain" iconOnly icon={RiAddLine} accessibilityLabel="Add" />
      <Button material="flat" loading disabled>
        Busy
      </Button>
    </>
  ),
  'Button styled': () => (
    <Button
      material="flat"
      style={{ height: 52, borderRadius: 24, backgroundColor: '#5433eb', minWidth: 80 }}
      textStyle={{ fontSize: 16 }}
      dataSet={{ bloomCase: '' }}
    >
      Purchase
    </Button>
  ),
  'Button.Group': () => (
    <Button.Group>
      <Button>One</Button>
      <Button>Two</Button>
    </Button.Group>
  ),
};
