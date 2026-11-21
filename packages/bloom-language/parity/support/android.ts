// The native parity suite draws the language's Android files (OxyOS takes them
// too), so Bloom's components see the same platform.
const { Platform } = require('react-native') as { Platform: { OS: string } };
Platform.OS = 'android';
