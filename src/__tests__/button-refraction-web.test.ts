/** @jest-environment jsdom */
import { SURFACE_REFRACTION_ID, ensureSurfaceRefraction } from '../surface/web-refraction';

describe('shared button refraction definition', () => {
  it('deduplicates mounts and rebuilds after external removal', () => {
    const doc = document.implementation.createHTMLDocument('glass');
    ensureSurfaceRefraction(doc);
    const filter = doc.getElementById(SURFACE_REFRACTION_ID)!;
    ensureSurfaceRefraction(doc);
    expect(doc.querySelectorAll('filter')).toHaveLength(1);
    expect(doc.getElementById(SURFACE_REFRACTION_ID)).toBe(filter);
    doc.querySelector('svg')!.remove();
    ensureSurfaceRefraction(doc);
    expect(doc.querySelectorAll('filter')).toHaveLength(1);
    expect(doc.getElementById(SURFACE_REFRACTION_ID)).not.toBe(filter);
    doc.querySelector('svg')!.setAttribute('data-recipe', 'old recipe');
    ensureSurfaceRefraction(doc);
    expect(doc.querySelectorAll('filter')).toHaveLength(1);
    expect(doc.querySelector('svg')!.getAttribute('data-recipe')).not.toBe('old recipe');
  });

  it('owns one independent definition per document and displaces SourceGraphic', () => {
    const first = document.implementation.createHTMLDocument('first');
    const second = document.implementation.createHTMLDocument('second');
    ensureSurfaceRefraction(first);
    ensureSurfaceRefraction(second);
    expect(first.querySelector('svg')!.ownerDocument).toBe(first);
    expect(second.querySelector('svg')!.ownerDocument).toBe(second);
    const filter = first.getElementById(SURFACE_REFRACTION_ID)!;
    expect(Array.from(filter.children, (child) => child.tagName)).toEqual([
      'feTurbulence',
      'feGaussianBlur',
      'feDisplacementMap',
    ]);
    const displacement = filter.querySelector('feDisplacementMap')!;
    expect(displacement.getAttribute('in')).toBe('SourceGraphic');
    expect(displacement.getAttribute('in2')).toBe('smooth-noise');
    expect(Number(displacement.getAttribute('scale'))).toBeGreaterThan(0);
    expect(first.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(first.querySelector('style')).toBeNull();
  });
});
