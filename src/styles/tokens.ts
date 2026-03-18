import { type TextStyle, type ViewStyle } from 'react-native';

/**
 * Spacing tokens following t-shirt size convention.
 * Compatible with ALF token naming.
 */
export const space = {
  _2xs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  _2xl: 24,
  _3xl: 32,
  _4xl: 40,
  _5xl: 60,
} as const;

/**
 * Font size tokens.
 */
export const fontSize = {
  _2xs: 10,
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  _2xl: 22,
  _3xl: 26,
  _4xl: 32,
  _5xl: 40,
} as const;

/**
 * Line height multipliers.
 */
export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.625,
} as const;

/**
 * Border radius tokens.
 */
export const borderRadius = {
  _2xs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  _2xl: 24,
  full: 999,
} as const;

/**
 * Gradient definitions for icon system.
 */
/**
 * Animation timing and spring tokens.
 * Centralized values ensure consistent motion across all components.
 */
export const animation = {
  duration: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 300,
  },
  spring: {
    snappy: { friction: 8, tension: 100 },
    gentle: { friction: 8, tension: 60 },
    bouncy: { friction: 6, tension: 120 },
  },
} as const;

/**
 * Gradient definitions for icon system.
 */
export const gradients = {
  primary: {
    values: [
      [0, '#054CFF'],
      [0.4, '#1085FE'],
      [0.6, '#1085FE'],
      [1, '#59B9FF'],
    ] as Array<[number, string]>,
    hover_value: '#1085FE',
  },
  sky: {
    values: [
      [0, '#0A7AFF'],
      [1, '#59B9FF'],
    ] as Array<[number, string]>,
    hover_value: '#0A7AFF',
  },
} as const;
