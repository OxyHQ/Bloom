export interface GestureResponderEvent {
  stopPropagation?: () => void;
}
export interface ViewStyle {
  flexGrow?: number;
}
export type StyleProp<T> = T | readonly T[] | null | undefined | false;
export interface ViewProps {
  style?: StyleProp<ViewStyle>;
}
