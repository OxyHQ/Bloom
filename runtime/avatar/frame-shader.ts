type Frame = Record<string, readonly number[]>;

/** Only branch predicates from immutable per-material frame uniforms are
 * specialized. Lighting numbers, pigments and animated instance fields remain
 * uniforms, so programs are shared across those values and all animation poses. */
export function createFrameShaderSpecializer(source: string) {
  const variants = new Map<string, string>();
  return (frame: Frame) => {
    const scalar = (field: string, index: number) => {
      const value = frame[field]?.[index];
      return value === undefined || !Number.isFinite(value) ? undefined : Math.fround(value);
    };
    const positive = (field: string, index: number) => {
      const value = scalar(field, index);
      return value === undefined ? undefined : value > 0;
    };
    const shadow = positive('effects', 0);
    const ao = positive('effects', 1);
    const studio = positive('studioParameters', 0);
    const thinking = positive('thinkingLightPositionStrength', 3);
    const debug = scalar('studioParameters', 2);
    const replacements: [RegExp, boolean | undefined][] = [
      [/f\.effects\.x\s*>\s*0\.0(?!\d)/g, shadow],
      [/f\.effects\.y\s*>\s*0\.0?(?!\d)/g, ao],
      [/f\.studioParameters\.x\s*>\s*0\.(?!\d)/g, studio],
      [/f\.studioParameters\.x\s*<=\s*0\.(?!\d)/g, studio === undefined ? undefined : !studio],
      [
        /f\.thinkingLightPositionStrength\.w\s*<=\s*0\.(?!\d)/g,
        thinking === undefined ? undefined : !thinking,
      ],
      ...[1, 2, 3].map((mode): [RegExp, boolean | undefined] => [
        new RegExp(`f\\.studioParameters\\.z\\s*==\\s*${mode}\\.(?!\\d)`, 'g'),
        debug === undefined ? undefined : debug === mode,
      ]),
    ];
    const key = replacements
      .map(([, value]) => (value === undefined ? '?' : value ? '1' : '0'))
      .join('');
    let shader = variants.get(key);
    if (shader === undefined) {
      shader = source;
      for (const [pattern, value] of replacements)
        if (value !== undefined) shader = shader.replace(pattern, value ? 'true' : 'false');
      variants.set(key, shader);
    }
    return shader;
  };
}
