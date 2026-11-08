import { AVATAR_SHAPES } from '../../agent-avatar/catalog-ids';
import { parseAvatarCharacter, resolveAvatarCharacter } from '../../agent-avatar/character';
import { CHARACTER_OPTIONS, CHARACTER_TEMPLATES } from '../constants';
import { EDITOR_SHAPE_ALIASES, EDITOR_SHAPE_CHOICES, editorShapeId } from '../shape-choices';

describe('editor silhouette choices', () => {
  it('shares one list without reinserting equivalent legacy selections', () => {
    expect(CHARACTER_OPTIONS.shape).toBe(EDITOR_SHAPE_CHOICES);
    const visible = EDITOR_SHAPE_CHOICES.map(([id]) => id);
    expect(visible).toHaveLength(26);
    expect(new Set(visible).size).toBe(26);
    for (const id of AVATAR_SHAPES) expect(visible).toContain(editorShapeId(id));
    for (const id of Object.keys(EDITOR_SHAPE_ALIASES)) expect(visible).not.toContain(id);
  });
  it('keeps every saved identifier valid without changing its resolved shape', () => {
    for (const shape of AVATAR_SHAPES) {
      const character = {
        shape,
        eyes: 'oval',
        eyewear: 'none',
        accessory: 'none',
        color: 'blue',
      } as const;
      expect(parseAvatarCharacter(character)).toEqual(character);
      expect(resolveAvatarCharacter(character).shape).toBe(shape);
    }
  });
  it('retains materially different stars, clouds, pebbles and flowers', () => {
    for (const id of [
      'star',
      'bot_star',
      'cloud',
      'bot_cloud',
      'pebble',
      'bot_pebble',
      'six_lobed_flower',
      'bot_flower',
    ] as const)
      expect(editorShapeId(id)).toBe(id);
  });
  it('maps template selection without changing saved authored character identities', () => {
    for (const id of [
      'clippo',
      'blue_beret',
      'alfred',
      'purple_heart',
      'lime_frog',
      'coral_monocle',
      'gus',
      'blue_spectacles',
      'lime_headphones',
      'peri',
    ]) {
      const character = CHARACTER_TEMPLATES[id]!;
      const before = JSON.stringify(character);
      const resolved = resolveAvatarCharacter(character);
      editorShapeId(resolved.shape);
      expect(JSON.stringify(character)).toBe(before);
      expect(resolveAvatarCharacter(character)).toEqual(resolved);
    }
  });
});
