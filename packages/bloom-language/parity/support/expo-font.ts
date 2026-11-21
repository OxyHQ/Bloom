/** expo-font as a native app has it once its fonts are in: loaded, no error. */
export function useFonts(): [boolean, Error | null] {
  return [true, null];
}
