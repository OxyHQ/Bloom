// Suppress console noise in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Bloom's non-English strings load on demand in an app. Suites assert what
// components SAY in each language, so every language is registered up front;
// `locale-catalogs.test.tsx` resets this to cover the loading itself.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerBloomTranslations } = require('../src/locale/translations');
for (const language of ['es', 'ca', 'de', 'fr', 'it', 'pt', 'ru', 'tr', 'ja', 'zh', 'ar', 'hi', 'bn', 'id']) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  registerBloomTranslations(language, require(`../src/locale/translations/${language}`).default);
}
