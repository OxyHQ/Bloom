/** TS components whose props take React elements: generic, optional, and a render function. */
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from 'react-native';

export interface Entry {
  postId: string;
}
export interface GridProps<T extends Entry> {
  data: T[];
  renderCell: (item: T, size: number) => ReactElement;
  emptyComponent?: ReactElement | null;
}
export function Grid<T extends Entry>(props: GridProps<T>): ReactElement {
  return (
    <View>
      {props.data.length === 0
        ? (props.emptyComponent ?? <Text>no empty</Text>)
        : props.data.map((item) => <View key={item.postId}>{props.renderCell(item, 10)}</View>)}
    </View>
  );
}
export function Card(props: { title: string; meta?: ReactNode }): ReactElement {
  return (
    <View>
      <Text>{props.title}</Text>
      {props.meta ? <Text>meta shown</Text> : null}
      {props.meta}
    </View>
  );
}
