// Suppress console noise in tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
