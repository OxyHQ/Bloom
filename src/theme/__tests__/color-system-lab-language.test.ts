import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const storySource = readFileSync(resolve(__dirname, '..', 'ColorSystemLab.stories.tsx'), 'utf8');

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
  const normalized = source.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return (normalized.match(/[a-z]+/g) ?? []).filter((word) => SPANISH_UI_WORDS.has(word));
}

describe('Color System Playground visible language', () => {
  it('keeps the substantial Mention playground source in English', () => {
    expect((storySource.match(/<Text\b/g) ?? []).length).toBeGreaterThan(35);
    expect(storySource).toContain('BLOOM COLOR LAB · MENTION INTERFACE');
    expect(storySource).toContain('Public view');
    expect(spanishWords(storySource)).toEqual([]);
  });

  it('detects a Spanish UI regression instead of passing an empty census', () => {
    const mutated = `${storySource}\n<Text>Vista pública</Text>`;
    expect(spanishWords(mutated)).toEqual(expect.arrayContaining(['vista', 'publica']));
  });
});
