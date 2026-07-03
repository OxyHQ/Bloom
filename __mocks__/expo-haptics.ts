// Manual mock for the optional `expo-haptics` peer. The real module reaches into
// native modules that are unavailable under jsdom/node, so tests exercise the
// hook against this stand-in and assert on `impactAsync`.

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Soft = 'soft',
  Rigid = 'rigid',
}

export const impactAsync = jest.fn(async (_style?: ImpactFeedbackStyle) => {});
