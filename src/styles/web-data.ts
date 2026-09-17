import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

/**
 * The web-only `dataSet` hook an adopted sheet's selectors hang off, as spread
 * props: react-native-web's channel to a `data-*` attribute (a class never
 * reaches the DOM here), and nothing on native.
 *
 * ONE copy for the whole package — thirteen families had grown their own,
 * byte for byte the same, under two names (`webDataSet` and `webDataSet`).
 *
 * ```tsx
 * <Pressable {...webDataSet({ 'bloom-track-row': 'true' })} />
 * // web:    <div data-bloom-track-row="true">
 * // native: nothing
 * ```
 */
export function webDataSet(entries: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: entries } : {};
}
