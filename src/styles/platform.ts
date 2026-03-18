import { Platform, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

type Style = ViewStyle & TextStyle & ImageStyle;

/**
 * Returns the provided styles only on web, undefined on native.
 */
export function web<T extends Style>(styles: T): T | undefined {
  if (Platform.OS === 'web') {
    return styles;
  }
  return undefined;
}

/**
 * Returns the provided styles only on native (iOS + Android), undefined on web.
 */
export function native<T extends Style>(styles: T): T | undefined {
  if (Platform.OS !== 'web') {
    return styles;
  }
  return undefined;
}

/**
 * Returns the provided styles only on iOS, undefined elsewhere.
 */
export function ios<T extends Style>(styles: T): T | undefined {
  if (Platform.OS === 'ios') {
    return styles;
  }
  return undefined;
}

/**
 * Returns the provided styles only on Android, undefined elsewhere.
 */
export function android<T extends Style>(styles: T): T | undefined {
  if (Platform.OS === 'android') {
    return styles;
  }
  return undefined;
}

/**
 * Returns platform-specific styles.
 */
export function platform<T extends Style>(specifics: {
  web?: T;
  ios?: T;
  android?: T;
  native?: T;
}): T | undefined {
  if (Platform.OS === 'web') {
    return specifics.web;
  }
  if (Platform.OS === 'ios') {
    return specifics.ios ?? specifics.native;
  }
  if (Platform.OS === 'android') {
    return specifics.android ?? specifics.native;
  }
  return specifics.native;
}

/**
 * Select a value based on theme name.
 */
export function select<T>(
  themeName: string,
  options: Record<string, T>,
): T {
  return options[themeName] ?? options['light'] ?? Object.values(options)[0]!;
}
