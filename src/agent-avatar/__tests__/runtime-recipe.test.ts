import { resolveCompleteEditorRecipe } from '../../../runtime/avatar/recipe';
import { type AvatarCharacter, resolveAvatarCharacter } from '../character';

/** What the renderer is asked to load for a character: one asset identity per combination. */
const recipe = (character: AvatarCharacter, previewPart?: 'eyes') =>
  resolveCompleteEditorRecipe({
    character: resolveAvatarCharacter(character),
    reduced: false,
    ...(previewPart ? { previewPart } : {}),
  });

describe('the renderer recipe', () => {
  it('loads the authored preset for a character that is exactly the preset', () => {
    const r = recipe({ preset: 'blue_beret' });
    expect(r.preset).toBe('blue_beret');
    expect(r.catalog).toBeUndefined();
  });

  it("leaves the preset's own paint out, and paints only what differs", () => {
    expect(recipe({ preset: 'blue_beret', color: 'blue' }).color).toBeUndefined();
    expect(recipe({ preset: 'blue_beret', color: 'orchid' }).color).toBe('#dd6adc');
    expect(recipe({ preset: 'blue_beret', bodyColor: '#123456' }).color).toBe('#123456');
    expect(recipe({ preset: 'gus' }).color).toBeUndefined();
  });

  it('composes the parts for a character that changed one of them', () => {
    const r = recipe({ preset: 'blue_beret', accessory: 'none', color: 'orchid' });
    expect(r.preset.startsWith('catalog:')).toBe(true);
    expect(r.catalog).toEqual({
      shape: 'six_lobed_flower',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'none',
    });
    expect(r.color).toBe('#dd6adc');
  });

  it('is the same asset for the same parts whatever the paint, so a color never loads a mesh', () => {
    const a = recipe({ preset: 'blue_beret', accessory: 'none', color: 'orchid' });
    const b = recipe({ preset: 'blue_beret', accessory: 'none', color: 'coral' });
    expect(a.preset).toBe(b.preset);
    expect(a.color).not.toBe(b.color);
  });

  it('takes the eye spacing, Todd as its rounded head, and the former paper bodies', () => {
    expect(recipe({ preset: 'blue_beret', eyeSpacing: 1.25 }).catalog).toMatchObject({
      eyeSpacing: 1.25,
    });
    expect(recipe({ preset: 'lime_frog', shape: 'todd' }).catalog?.shape).toBe(
      'rounded_head_two_ears',
    );
    expect(recipe({ preset: 'blue_beret', shape: 'pebble' }).catalog?.shape).toBe('pebble');
  });

  it('hides the face with eyes: none, and previews the eyes alone on request', () => {
    expect(recipe({ preset: 'blue_beret', eyes: 'none' }).catalog?.eyes).toBe('none');
    const preview = recipe({ preset: 'blue_beret' }, 'eyes');
    expect(preview.catalog).toMatchObject({ previewPart: 'eyes' });
  });

  it('reports what it drew and what can be drawn', () => {
    const { capabilities } = recipe({ preset: 'alfred', color: 'coral' });
    expect(capabilities.selected).toEqual({
      shape: 'rounded_triangle',
      eyes: 'sleepy_lids',
      eyewear: 'tall_oval_frames',
      accessory: 'bow',
      color: 'coral',
    });
    expect(capabilities.available['shape:heart']).toBe(true);
    expect(capabilities.available['eyes:none']).toBe(true);
    expect(capabilities.available['color:coral']).toBe(true);
    expect(capabilities.available['shape:blob']).toBeUndefined();
  });
});
