import { readFileSync } from 'node:fs';
import path from 'node:path';

// Wiring guard only. The emitted bundle and a real animated overlay must also
// be checked: dev optimizeDeps can mask a broken production CommonJS bridge.
it('converts Reanimated mixed-module RNW compiler requires without stripping optional peers', () => {
  const main = readFileSync(path.join(__dirname, '../../.storybook/main.ts'), 'utf8');
  expect(main).toContain('transformMixedEsModules: true');
  expect(main).toContain("ignoreTryCatch: (id: string) => !id.startsWith('react-native-web/dist/')");
  expect(main).not.toMatch(/find:\s*['"]react-native-reanimated['"]/);
});

it('keeps the real Expo web bootstrap bridge reachable in static builds', () => {
  const main = readFileSync(path.join(__dirname, '../../.storybook/main.ts'), 'utf8');
  expect(main).toContain("name: 'bloom-expo-web-bootstrap'");
  expect(main).toContain('moduleSideEffects: true');
  expect(main).toContain('ensureNativeModulesAreInstalled');
});
