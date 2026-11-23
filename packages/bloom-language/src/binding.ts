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
 * A pull to refresh driven by what refreshes: whether it is refreshing, and
 * the action a pull runs (a query's `isRefetching` and `refetch`), named as
 * React Native's `refreshing` and `onRefresh`. Nothing is written back: the
 * value ends the refresh when the work does.
 */
export interface RefreshAction {
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
}

/**
 * A pull to refresh: a binding a pull writes `true` (the app writes `false`
 * when it has refreshed), or a refreshing value and its action.
 */
export type Refresh = Binding<boolean> | RefreshAction;

/**
 * A refresh control's tint: one colour role, which iOS's `tintColor` and
 * Android's `colors` both paint, or each platform's own (`{ ios: 'primary' }`
 * tints iOS only, Android's spinner keeping its look).
 */
export type RefreshTint<C extends string = string> = C | { readonly ios?: C; readonly android?: C };

/** A pull to refresh as React Native's `refreshing` and `onRefresh`. */
export function refreshing(refresh: Refresh): {
  refreshing: boolean;
  onRefresh: () => void;
} {
  if ('onRefresh' in refresh)
    return { refreshing: refresh.refreshing, onRefresh: refresh.onRefresh };
  const [value, set] = refresh;
  return { refreshing: value, onRefresh: () => set(true) };
}

/** Any binding, whatever it holds: a binding modifier's value before its node reads it. */
export type AnyBinding = readonly [value: unknown, set: (value: never) => void];
