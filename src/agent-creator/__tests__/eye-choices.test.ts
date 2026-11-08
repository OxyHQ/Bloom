import { CHARACTER_OPTIONS, CHARACTER_PRESETS, CHARACTER_TEMPLATES } from '../constants';
import { resolveAvatarCharacter } from '../../agent-avatar/character';
import { composeVectorCharacter } from '../../agent-avatar/vector-compose';
import { vectorAssetLoader } from '../../agent-avatar/vector-assets';
import { vectorTemplateImports } from '../../agent-avatar/vector-asset-imports';

it('offers only paired-eye styles and current templates while retaining saved single-eye recipes', () => {
  expect(CHARACTER_OPTIONS.eyes.map(([id]) => String(id))).not.toContain('cyclops');
  expect(CHARACTER_OPTIONS.eyes).toHaveLength(12);
  for (const { id } of CHARACTER_PRESETS)
    expect(resolveAvatarCharacter(CHARACTER_TEMPLATES[id]!).eyes).not.toBe('cyclops');
  expect(resolveAvatarCharacter({ preset: 'alfred', eyes: 'cyclops' }).eyes).toBe('cyclops');
});
it('composes Alfred with two eyes instead of reusing the historical single-eye asset', async () => {
  const character = resolveAvatarCharacter(CHARACTER_TEMPLATES.alfred!);
  expect(character.eyes).toBe('oval');
  expect(await vectorAssetLoader.template(character)).toBeUndefined();
  const result = await composeVectorCharacter(character, vectorAssetLoader);
  const eyes = result.parts.filter((p) => p.role === 'eye');
  expect(eyes).toHaveLength(2);
  const previous = (await vectorTemplateImports.alfred()).default;
  expect(eyes.map((p) => p.points)).not.toEqual(
    previous.parts.filter((p) => p.role === 'eye').map((p) => p.points),
  );
});
