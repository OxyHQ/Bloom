import { IS_WEB } from './platform';

/** react-native-web `dataSet` for a `data-*` attribute; nothing on native. */
export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_WEB ? { dataSet: { [name]: value } } : {};
}

/**
 * Several `data-*` attributes on one element. Spreading several `dataHook`s
 * onto one element keeps only the last: each is a whole `dataSet` prop.
 */
export function dataHooks(values: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: values } : {};
}
