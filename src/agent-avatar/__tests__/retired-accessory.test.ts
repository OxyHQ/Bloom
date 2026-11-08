import { CHARACTER_OPTIONS, CHARACTER_TEMPLATES } from '../../agent-creator/constants';
import { resolveAvatarCharacter } from '../character';
import { vectorAssetLoader } from '../vector-assets';

it('never offers or supplies the retired bulb in current characters', () => {
  expect(CHARACTER_OPTIONS.accessory.some(([id]) => id === ('orb' as string))).toBe(false);
  for (const character of Object.values(CHARACTER_TEMPLATES)) {
    expect(resolveAvatarCharacter(character).accessory).not.toBe('orb');
  }
});
it('retains the authored Gus animation without resurrecting the baked bulb', async () => {
  const asset = await vectorAssetLoader.template(resolveAvatarCharacter({ preset: 'gus' }));
  expect(asset).toBeDefined();
  expect(asset!.parts.some((part) => part.role === 'accessory')).toBe(false);
  expect(asset!.parts.some((part) => part.role === 'eyewear')).toBe(true);
  expect(asset!.parts.some((part) => part.role === 'panel')).toBe(true);
  for (const clip of Object.values(asset!.clips))
    expect(clip.parts).toHaveLength(asset!.parts.length);
});
