import { loadVectorPortrait, vectorPortraitKey } from '../vector-portrait';
import { avatarCharacterOf, resolveAvatarCharacter } from '../character';
const mockCompose = jest.fn();
const mockFrame = jest.fn();
jest.mock('../vector-compose', () => ({
  composeVectorCharacter: (...args: unknown[]) => mockCompose(...args),
}));
const loader = {} as never;
jest.mock('../vector-frame', () => ({
  renderVectorFrame: (...args: unknown[]) => mockFrame(...args),
}));
it('shares one composition and SVG frame across 50 equal portraits and size-independent consumers', async () => {
  let finish!: (value: unknown) => void;
  mockCompose.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const frame = { viewBox: '0 0 320 320', paths: [] };
  mockFrame.mockReturnValue(frame);
  const character = { preset: 'blue_beret' as const };
  const recipes = [character, avatarCharacterOf(resolveAvatarCharacter(character))];
  expect(vectorPortraitKey(recipes[0]!)).toBe(vectorPortraitKey(recipes[1]!));
  const pending = Array.from({ length: 50 }, (_, i) => loadVectorPortrait(recipes[i % 2]!, loader));
  expect(mockCompose).toHaveBeenCalledTimes(1);
  finish({ parts: [] });
  const frames = await Promise.all(pending);
  expect(frames.every((value) => value === frame)).toBe(true);
  expect(mockFrame).toHaveBeenCalledTimes(1);
  expect(await loadVectorPortrait(character, loader)).toBe(frame);
  expect(mockCompose).toHaveBeenCalledTimes(1);
});
it('keeps different saved paints separate', () => {
  expect(vectorPortraitKey({ preset: 'alfred', bodyColor: '#123456' })).not.toBe(
    vectorPortraitKey({ preset: 'alfred', bodyColor: '#654321' }),
  );
});
