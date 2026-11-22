// The harness draws Android, as an app on the Pixel does.
const { Platform } = require('react-native') as { Platform: { OS: string } };
Platform.OS = 'android';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
