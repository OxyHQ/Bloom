import { Text } from 'react-native';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverSeparator,
  PopoverTitle,
  PopoverTrigger,
} from '@bloom/popover';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'closed trigger': () => (
    <Popover>
      <PopoverTrigger label="Info" testID="trigger">
        <Text>Info</Text>
      </PopoverTrigger>
      <PopoverContent>
        <Text>Body</Text>
      </PopoverContent>
    </Popover>
  ),
  'open sheet with parts': () => (
    <Popover defaultOpen>
      <PopoverTrigger label="Info" style={{ margin: 2 }}>
        <Text>Info</Text>
      </PopoverTrigger>
      <PopoverContent label="Details" style={{ paddingTop: 3 }} testID="content">
        <PopoverHeader leading={<Text>A</Text>}>
          <PopoverTitle>Title</PopoverTitle>
          <PopoverDescription>Description</PopoverDescription>
        </PopoverHeader>
        <PopoverSeparator />
        <PopoverTitle tone="secondary" style={{ marginTop: 1 }}>
          Group
        </PopoverTitle>
        <PopoverFooter style={{ gap: 4 }}>
          <Text>Footer</Text>
        </PopoverFooter>
        <PopoverSeparator style={{ marginTop: 0 }} testID="sep" />
      </PopoverContent>
    </Popover>
  ),
};
