/** The API/worker must never need UI peers to use document commands or Yjs. */
jest.mock('@oxy.so/bloom/chat-composer', () => {
  throw new Error('UI loaded by a headless entrypoint');
});
jest.mock('react-native', () => {
  throw new Error('React Native loaded by a headless entrypoint');
});
jest.mock('react', () => {
  throw new Error('React loaded by a headless entrypoint');
});
it('loads model and Yjs independently of the React adapter and required Bloom UI peer', () => {
  jest.isolateModules(() => {
    const model = require('..') as typeof import('..');
    const yjs = require('../../yjs') as typeof import('../../yjs');
    expect(typeof model.EditorStore).toBe('function');
    expect(typeof yjs.YjsBinding).toBe('function');
  });
});
