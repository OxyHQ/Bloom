/** @type {import('jest').Config} */
const support = `${__dirname}/src/__tests__/support`;
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          esModuleInterop: true,
          strict: true,
          noUncheckedIndexedAccess: true,
          skipLibCheck: true,
        },
        diagnostics: { ignoreCodes: ['TS151001'] },
      },
    ],
  },
  // The renderer is tested against React Native as plain host names, and
  // Bloom's token tables are read from Bloom's own source (not copies), so a
  // token suite fails when a Bloom rung moves. Bloom's components are named
  // stand-ins: what reaches them is the prop contract under test.
  moduleNameMapper: {
    '^react-native$': `${support}/react-native.ts`,
    '^react-native-css$': `${support}/react-native-css.ts`,
    '^@oxy.so/bloom/styles$': `${support}/bloom-styles.ts`,
    '^@oxy.so/bloom/typography$': `${support}/bloom-typography.ts`,
    '^@oxy.so/bloom/icons/shared$': `${support}/bloom-icons.ts`,
    '^@oxy.so/bloom/icons/Ri[A-Za-z0-9]+$': `${support}/bloom-icon-modules.ts`,
    '^@oxy.so/bloom/avatar$': `${support}/bloom-avatar.ts`,
    '^@oxy.so/bloom/hooks$': `${support}/bloom-hooks.ts`,
    '^@oxy.so/bloom/shapes$': `${support}/bloom-shapes.ts`,
    '^@oxy.so/bloom/design-tokens$': `${support}/bloom-design-tokens.ts`,
    '^@oxy.so/bloom/theme$': `${support}/bloom-theme.ts`,
    '^@oxy.so/bloom/app-shell/hooks$': `${support}/bloom-app-shell-hooks.ts`,
    '^@oxy.so/bloom/(blur|button|engagement-bar|image|surface|fab|page-header|bottom-bar|dropdown-menu|aspect-ratio|concentric|divider|fill|grid|avatar-group|badge|chat-indicators|icon-circle|loading|skeleton|subtle-hover)$': `${support}/bloom-components.ts`,
    '^@oxy.so/bloom/(agent-avatar|chat-composer|chart-cards|composer-panel|ai-chat|stat-cards|media-controls|agent-limits-card|usage-card|agent-thinking|agent-progress|agent-log|composer-loader|conversation-sidebar|questionnaire|chat-screen|chat-list|message-media|listing-details|map-marker|media-header|media-shelf|subscription-plans|user-hover-card|card-form|checkout-sheet)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(route-stops|note-card|share-sheet|connection-dots|outline-nav|pagination|progressive-blur|row-actions|swipe-row|theme-toggle)$': `${support}/bloom-products.ts`,
    // Wave 7: the commerce families.
    '^@oxy.so/bloom/(contact-card|lead-score|pipeline)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(important-alerts-card|patient-info-card|recent-hires-card)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(media-card)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(lyrics)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/creator-studio$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(address|payment-method|price-breakdown|payment-status|cart-panel|menu-item|vendor-card|checkout-summary|delivery-slot|order-confirmation)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(media-player)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(carrier-quote|earnings|job-board|proof-of-delivery|shipment-request|vehicle-picker)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(music-library|queue-panel|track-list)$': `${support}/bloom-products.ts`,
    '^@oxy.so/bloom/(app-shell|screen|dialog|tab-pager|tab-pager/expo-router|panel-routing/expo-router)$': `${support}/bloom-router.ts`,
    // Optional native modules: absent unless a test mocks one in.
    '^(expo|expo-blur|expo-glass-effect|expo-router|@expo/ui/swift-ui/modifiers)$': `${support}/absent/$1.ts`,
    '^@expo/ui/swift-ui$': `${support}/absent/@expo/ui/swift-ui/index.ts`,
    '^expo-router/(native-tabs|react-navigation)$': `${support}/absent/expo-router-$1.ts`,
    '^@oxy.so/bloom/motion$': `${support}/bloom-motion.ts`,
    '^@oxy.so/bloom/sticker$': `${support}/bloom-runtime.ts`,
    '^react-native-reanimated$': `${support}/react-native-reanimated.ts`,
    '^react-native-gesture-handler$': `${support}/react-native-gesture-handler.ts`,
    '^react$': require.resolve('react'),
    '^react/(.*)$': `${require('node:path').dirname(require.resolve('react/package.json'))}/$1`,
  },
  // A platform file resolves as iOS's (the stand-in Platform.OS); a test of
  // another platform's file imports it by its full name.
  moduleFileExtensions: ['ios.tsx', 'ios.ts', 'tsx', 'ts', 'js', 'json'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
};
