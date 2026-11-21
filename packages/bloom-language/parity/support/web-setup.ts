// Bloom's root `__mocks__/react-native.ts` stands in for React Native in every
// suite; the web suite renders react-native-web itself, as Bloom's web suites do.
jest.mock('react-native', () => jest.requireActual('react-native-web'));
