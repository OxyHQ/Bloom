/** Catalog parts extend the existing avatar recipe without discarding its shape or expression fields. */
export type AvatarCharacterCategory =
  'shape' | 'color' | 'eyes' | 'eyewear' | 'accessory';

export type AvatarCharacterConfig = {
  /** Named catalog preset, including Clippo (`clippo`), or a saved renderer ID. */
  preset: string;
  /** Clippo's open wire body and ring eyes are independently selectable with ID `clippo`. */
  selections?: Partial<Record<AvatarCharacterCategory, string>>;
  /** Custom body RGB accepted by the original renderer, stored as lowercase #RRGGBB. */
  bodyColor?: string;
};

const categories: readonly AvatarCharacterCategory[] = [
  'shape',
  'color',
  'eyes',
  'eyewear',
  'accessory',
];
const validId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 63;

/** Validate the JSON boundary before passing saved configuration to the optional renderer. */
export function parseCharacterConfig(value: unknown): AvatarCharacterConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid character configuration.');
  const candidate = value as Record<string, unknown>;
  if (!validId(candidate.preset)) throw new Error('Invalid character preset.');
  const result: AvatarCharacterConfig = { preset: candidate.preset };
  if (candidate.bodyColor !== undefined) {
    if (
      typeof candidate.bodyColor !== 'string' ||
      candidate.bodyColor.length !== 7 ||
      !/^#[0-9a-f]{6}$/i.test(candidate.bodyColor)
    )
      throw new Error('Invalid character body color.');
    result.bodyColor = candidate.bodyColor.toLowerCase();
  }
  if (candidate.selections !== undefined) {
    if (
      !candidate.selections ||
      typeof candidate.selections !== 'object' ||
      Array.isArray(candidate.selections)
    )
      throw new Error('Invalid character selections.');
    const selections: NonNullable<AvatarCharacterConfig['selections']> = {};
    for (const [category, id] of Object.entries(candidate.selections)) {
      if (
        !categories.includes(category as AvatarCharacterCategory) ||
        !validId(id)
      )
        throw new Error('Invalid character selection.');
      selections[category as AvatarCharacterCategory] = id;
    }
    result.selections = selections;
  }
  if ('state' in candidate)
    throw new Error('Opaque character state is not supported.');
  return result;
}
