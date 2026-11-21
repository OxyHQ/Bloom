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
