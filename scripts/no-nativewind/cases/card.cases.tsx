import { Text } from 'react-native';
import {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  SelectionCard,
} from '@bloom/card';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'Card plain': () => (
    <Card testID="card">
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardBody>
        <Text>Body</Text>
      </CardBody>
      <CardFooter>
        <Text>Footer</Text>
      </CardFooter>
    </Card>
  ),
  'Card pressable, outline, styled': () => (
    <Card
      appearance="outline"
      radius="radius-28"
      border="none"
      onPress={() => {}}
      style={{ padding: 20, gap: 16, maxWidth: 372 }}
    >
      <CardTitle style={{ fontSize: 20 }}>Pressable</CardTitle>
    </Card>
  ),
  'Card accent tone': () => (
    <Card tone="accent" appearance="solid">
      <CardTitle>Accent</CardTitle>
      <CardDescription numberOfLines={1}>Paired colour</CardDescription>
    </Card>
  ),
  SelectionCard: () => (
    <SelectionCard
      selection="single"
      selected
      onPress={() => {}}
      title="Plan"
      description="Monthly"
    />
  ),
};
