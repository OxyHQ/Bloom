import { normalizeNative } from '../../parity/support/normalize';

/** One View with this style, as the parity's native tree. */
const view = (style: Record<string, unknown>) => [{ type: 'View', props: { style }, children: [] }];

describe('the native parity folds', () => {
  it('reads transparent as black at no alpha, as #0000 is', () => {
    expect(normalizeNative(view({ backgroundColor: 'transparent' }))).toEqual(
      normalizeNative(view({ backgroundColor: '#0000' })),
    );
    expect(normalizeNative(view({ backgroundColor: 'transparent' }))).toEqual(
      normalizeNative(view({ backgroundColor: '#00000000' })),
    );
  });

  it('reads inset as its four edges, an edge of its own over it', () => {
    expect(normalizeNative(view({ position: 'absolute', inset: 0 }))).toEqual(
      normalizeNative(view({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 })),
    );
    expect(normalizeNative(view({ inset: 0, top: 8 }))).toEqual(
      normalizeNative(view({ top: 8, right: 0, bottom: 0, left: 0 })),
    );
  });
});
