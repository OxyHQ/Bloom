import { directionForLocale } from '../context';
it.each([['ar','rtl'], ['he-IL','rtl'], ['fa','rtl'], ['en','ltr'], ['zh-Hans','ltr'], ['az-Arab','rtl'], ['ar-Latn','ltr']])('resolves %s to %s without changing device locale', (locale, direction) => {
  expect(directionForLocale(locale)).toBe(direction);
});
