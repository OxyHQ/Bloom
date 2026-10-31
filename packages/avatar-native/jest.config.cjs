module.exports = {
 rootDir: '../..', testEnvironment: 'node',
 testMatch: ['<rootDir>/packages/avatar-native/src/__tests__/**/*.test.{ts,tsx}'],
 modulePathIgnorePatterns: ['<rootDir>/.claude/', '<rootDir>/.worktrees/', '<rootDir>/.local/'],
 moduleNameMapper: { '^react-native$': '<rootDir>/__mocks__/react-native.ts' },
 setupFiles: ['<rootDir>/__mocks__/setup.ts'],
 transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', target: 'ES2020', module: 'commonjs', moduleResolution: 'node', esModuleInterop: true, strict: true, skipLibCheck: true, resolveJsonModule: true } }] },
};
