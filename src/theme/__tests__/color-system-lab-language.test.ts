import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const storySource = [
  resolve(__dirname, '..', 'ColorSystemLab.stories.tsx'),
  resolve(__dirname, '../../../templates/social/SocialContent.tsx'),
  resolve(__dirname, '../../../templates/social/SocialTemplate.tsx'),
]
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

const SPANISH_UI_WORDS = new Set([
  'accion',
  'aplicada',
  'cambia',
  'capas',
  'cajas',
  'cada',
  'comparar',
  'concentran',
  'conserva',
  'curada',
  'decorativas',
  'derivadas',
  'dinamicas',
  'direcciones',
  'ensena',
  'espacio',
  'estado',
  'familia',
  'filtra',
  'flujo',
  'generada',
  'grandes',
  'identidad',
  'iniciada',
  'interfaz',
  'invertidas',
  'jerarquia',
  'marca',
  'mantienen',
  'menos',
  'modo',
  'mas',
  'navegacion',
  'neutras',
  'paleta',
  'pareja',
  'parejas',
  'profundas',
  'publica',
  'recetas',
  'relacion',
  'seleccion',
  'sesion',
  'sin',
  'superficies',
  'tarjeta',
  'todas',
  'variedad',
  'visibles',
  'vista',
]);

function spanishWords(source: string): string[] {
  const normalized = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return (normalized.match(/[a-z]+/g) ?? []).filter((word) => SPANISH_UI_WORDS.has(word));
}

describe('Color System Playground visible language', () => {
  it('keeps the shared color playground and Mention content in English', () => {
    // The lab composes SocialTemplate and Storybook controls now: duplicated
    // canvas toolbars are not part of the language census. Assert real UI
    // anchors across the lab and template so an empty source cannot pass.
    for (const copy of [
      'Color recipes',
      'Compare the token pairs',
      'Search Mention',
      'People on Mention are the first to know.',
    ]) {
      expect(storySource).toContain(copy);
    }
    expect(spanishWords(storySource)).toEqual([]);
  });

  it('detects a Spanish UI regression instead of passing an empty census', () => {
    const mutated = `${storySource}\n<Text>Vista pública</Text>`;
    expect(spanishWords(mutated)).toEqual(expect.arrayContaining(['vista', 'publica']));
  });
});
