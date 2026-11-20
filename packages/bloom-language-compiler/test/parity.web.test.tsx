import { describeParity } from './parity';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'web',
    select: <T,>(spec: { web?: T; default?: T }) => spec.web ?? spec.default,
  },
}));

describeParity('web');
