import { IS_WEB } from './platform';

/** react-native-web `dataSet` for a `data-*` attribute; nothing on native. */
export function dataHook(name: string, value = ''): Record<string, unknown> {
  return IS_WEB ? { dataSet: { [name]: value } } : {};
}
