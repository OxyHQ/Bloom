/** Executed in the build browser against the checked-out runtime; never imported by consumers. */
export async function extractCharacter(entry) {
  const { composeCatalog } = await import('/runtime/avatar/catalog-compose.ts');
  const { attachCatalogComputer } = await import('/runtime/avatar/catalog-computer.ts');
  const { createCatalogMotion } = await import('/runtime/avatar/catalog-motion-factory.ts');
  const { loadAuthoredAsset } = await import('/runtime/avatar/catalog.ts');
  const { loadAuthoredMotion } = await import('/runtime/avatar/motion-catalog.ts');
  const { prepareCanonicalTuft } = await import('/runtime/avatar/canonical-tuft.ts');
  const { resolveAvatarCharacter } = await import('/src/agent-avatar/character.ts');
  const { resolveCompleteEditorRecipe } = await import('/runtime/avatar/recipe.ts');
  const { CHARACTER_COLORS } = await import('/src/agent-avatar/character-colors.ts');
  const { Vector3, Quaternion } = await import('/node_modules/three/build/three.module.js');
  const { loadCatalogDonor } = await import('/runtime/avatar/catalog-library.ts');
  const character = resolveAvatarCharacter(entry.character);
  const recipe = resolveCompleteEditorRecipe({ character });
  let source, samplers;
  const categories = new Map();
  const labelCategories = new Map();
  if (recipe.catalog) {
    const composed = await composeCatalog(recipe.catalog, 'low');
    const work = await attachCatalogComputer(composed, recipe.catalog.shape);
    ({ samplers } = await createCatalogMotion(composed, 'low', work));
    source = composed.source;
    for (const { part } of composed.bindings) categories.set(part.id, part.category);
  } else {
    source = await loadAuthoredAsset(recipe.preset, 'low', true);
    samplers = await loadAuthoredMotion(recipe.preset);
    prepareCanonicalTuft(source.parts);
    for (const category of ['eyes', 'eyewear', 'accessory']) {
      const selected = character[category];
      if (selected === 'none') continue;
      const donor = await loadCatalogDonor(category, selected, 'low');
      for (const piece of donor.pieces)
        if (donor.selectedPartIds.includes(piece.id) && !piece.fur)
          labelCategories.set(piece.label, category);
    }
  }
  const paint = character.paint.bodyColor || CHARACTER_COLORS[character.paint.color];
  const round = (v) => +v.toFixed(5);
  const pieces = source.parts.filter((p) => !p.fur && p.fields.referencePose?.[3] !== -16);
  const parts = pieces.map((p) => {
    const geo = p.geometry,
      pos = geo.getAttribute('position'),
      d0 = geo.getAttribute('delta0'),
      d1 = geo.getAttribute('delta1');
    const points = [],
      delta0 = [],
      delta1 = [],
      remap = [],
      keys = new Map();
    const vec = (a, i) => (a ? [a.getX(i), a.getY(i), a.getZ(i)].map(round) : [0, 0, 0]);
    for (let i = 0; i < pos.count; i++) {
      const xyz = vec(pos, i),
        a = vec(d0, i),
        b = vec(d1, i),
        key = [...xyz, ...a, ...b].join(',');
      if (!keys.has(key)) {
        keys.set(key, points.length);
        points.push(xyz);
        delta0.push(a);
        delta1.push(b);
      }
      remap.push(keys.get(key));
    }
    const faces = [],
      indices = geo.getIndex();
    for (let i = 0; i < indices.count; i += 3) {
      const f = [0, 1, 2].map((k) => remap[indices.getX(i + k)]);
      if (new Set(f).size === 3) faces.push(f);
    }
    const edges = new Map();
    faces.forEach((f, i) => {
      f.forEach((v, j) => {
        const w = f[(j + 1) % 3],
          key = v < w ? `${v}:${w}` : `${w}:${v}`;
        if (!edges.has(key)) edges.set(key, [v, w, i, -1]);
        else edges.get(key)[3] = i;
      });
    });
    const kind = p.fields.referencePose?.[3],
      workOnly = p.activity === 'computer';
    const category = categories.get(p.id) || labelCategories.get(p.label);
    const role =
      kind === -40
        ? 'hand'
        : kind === -4
          ? 'panel'
          : kind === -24
            ? 'screen'
            : category === 'body' || p.id === 0
              ? 'body'
              : category === 'eyes'
                ? 'eye'
                : category === 'eyewear'
                  ? 'eyewear'
                  : category === 'accessory'
                    ? 'accessory'
                    : /eye|pupil|iris/i.test(p.label || '')
                      ? 'eye'
                      : /spectacle|sunglass|monocle|glasses|frame|bridge|concealed-arm/i.test(
                            p.label || '',
                          )
                        ? 'eyewear'
                        : 'accessory';
    const bodyPaint = role === 'body' || role === 'hand' || p.colorRole === 'body';
    const c = p.fields.colorRoughness || [0, 0, 0];
    const srgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
    const fill = bodyPaint
      ? paint
      : role === 'panel'
        ? '#e56da6'
        : role === 'screen'
          ? '#ffffff'
          : '#' +
            c
              .slice(0, 3)
              .map((v) =>
                Math.round(Math.min(1, Math.max(0, srgb(v))) * 255)
                  .toString(16)
                  .padStart(2, '0'),
              )
              .join('');
    return {
      id: p.id,
      label: p.label || `${role}-${p.id}`,
      workOnly,
      role,
      bodyPaint,
      color: fill,
      opacity: role === 'panel' ? 0.22 : 1,
      points,
      faces,
      edges: [...edges.values()],
      ...(delta0.some((v) => v.some((x) => x)) ? { delta0 } : {}),
      ...(delta1.some((v) => v.some((x) => x)) ? { delta1 } : {}),
    };
  });
  const clips = {};
  const position = new Vector3(),
    rotation = new Quaternion(),
    scale = new Vector3();
  for (const kind of ['idle', 'reaction', 'work']) {
    const sampler = samplers[kind],
      duration =
        kind === 'work'
          ? (samplers.workReturn?.time ?? sampler.clip.duration)
          : sampler.clip.duration,
      fps = 24,
      count = Math.ceil(duration * fps) + 1,
      pose = sampler.createPose();
    const records = parts.map(() => ({
      matrix: [],
      translation: [],
      rotation: [],
      scale: [],
      camera: [],
      coverage: [],
      parameters: [],
      reference: [],
    }));
    for (let f = 0; f < count; f++) {
      sampler.sample(Math.min(f / fps, duration), pose);
      parts.forEach((part, i) => {
        const p = pose.find((p) => p.id === `mesh:${part.id}`),
          target = records[i];
        if (!p) return;
        p.world.decompose(position, rotation, scale);
        target.matrix.push(...p.world.elements.map(round));
        target.translation.push(...position.toArray().map(round));
        target.rotation.push(...rotation.toArray().map(round));
        target.scale.push(...scale.toArray().map(round));
        for (const [key, field, fallback] of [
          ['camera', 'camera', [1, 1, 0, 1]],
          ['coverage', 'coverage', [1, 0, 0, 0]],
          ['parameters', 'parameters', [0, 0, 0, 0]],
          ['reference', 'referencePose', [0, 0, 0, 0]],
        ])
          target[key].push(...(p.fields[field] || fallback).map(round));
      });
    }
    clips[kind] = {
      duration,
      fps,
      parts: records.map((r) =>
        r.matrix.length
          ? Object.fromEntries(
              Object.entries(r).map(([key, a]) => {
                const width =
                    key === 'matrix' ? 16 : ['translation', 'scale'].includes(key) ? 3 : 4,
                  first = a.slice(0, width);
                return [
                  key,
                  a.every((v, i) => v === first[i % width]) ? { value: first } : { samples: a },
                ];
              }),
            )
          : null,
      ),
    };
  }
  return {
    identity: {
      id: entry.id,
      name: entry.title,
      character: entry.character,
      recipe: {
        shape: character.shape,
        eyes: character.eyes,
        eyewear: character.eyewear,
        accessory: character.accessory,
        ...(character.eyeSpacing === undefined ? {} : { eyeSpacing: character.eyeSpacing }),
      },
      color: paint,
    },
    parts,
    clips,
  };
}
