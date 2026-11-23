/**
 * A value and the function that changes it: what React's `useState` returns,
 * and SwiftUI's `Binding`. Every input takes one, so the screen owns the value
 * and the control only reads and writes it:
 *
 * ```ts
 * const [name, setName] = useState('');
 * TextField([name, setName], 'Name')
 * Toggle(useState(false))
 * ```
 *
 * A store's value is a binding too: `[draft.title, (title) => update({ title })]`.
 */
export type Binding<T> = readonly [value: T, set: (value: T) => void];

/**
 * A binding of a Bloom prop's value: `Bound<ReviewCardProps, 'expanded'>` is
 * `Binding<boolean>`. A node's editable value is typed by what its Bloom
 * component holds.
 */
export type Bound<Props, Key extends keyof Props> = Binding<Exclude<Props[Key], undefined>>;

/**
 * A pull to refresh's binding as React Native's `refreshing` and `onRefresh`:
 * a pull writes `true`, and the app writes `false` when it has refreshed.
 */
export function refreshing([value, set]: Binding<boolean>): {
  refreshing: boolean;
  onRefresh: () => void;
} {
  return { refreshing: value, onRefresh: () => set(true) };
}

/** Any binding, whatever it holds: a binding modifier's value before its node reads it. */
export type AnyBinding = readonly [value: unknown, set: (value: never) => void];
