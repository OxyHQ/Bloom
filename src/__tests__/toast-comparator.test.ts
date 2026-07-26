import React from 'react';

import { areToastsEqual } from '../toast/toast-comparator';
import { isToastAction, type ToastProps } from '../toast/types';

const baseToast = (overrides: Partial<ToastProps> = {}): ToastProps => ({
  id: 'a',
  index: 0,
  title: 'Saved',
  numberOfToasts: 1,
  orderedToastIds: ['a'],
  ...overrides,
});

describe('areToastsEqual', () => {
  it('treats two structurally identical toasts as equal', () => {
    expect(areToastsEqual(baseToast(), baseToast())).toBe(true);
  });

  it.each<[string, Partial<ToastProps>]>([
    ['id', { id: 'b' }],
    ['title', { title: 'Changed' }],
    ['variant', { variant: 'error' }],
    ['description', { description: 'details' }],
    ['closeButton', { closeButton: true }],
    ['invert', { invert: true }],
    ['position', { position: 'top-center' }],
    ['dismissible', { dismissible: false }],
    ['duration', { duration: 10 }],
    ['important', { important: true }],
    ['richColors', { richColors: true }],
    ['style', { style: { opacity: 0.5 } }],
    ['styles', { styles: { title: { fontSize: 9 } } }],
  ])('reports a change of %s', (_field, overrides) => {
    expect(areToastsEqual(baseToast(), baseToast(overrides))).toBe(false);
  });

  it('compares icon and jsx by reference', () => {
    const icon = React.createElement('Icon');
    expect(
      areToastsEqual(baseToast({ icon }), baseToast({ icon })),
    ).toBe(true);
    expect(
      areToastsEqual(
        baseToast({ icon }),
        baseToast({ icon: React.createElement('Icon') }),
      ),
    ).toBe(false);
  });

  it('compares promiseOptions by reference', () => {
    const promiseOptions = {
      promise: Promise.resolve('ok'),
      loading: 'Saving…',
      error: 'Failed',
    };
    expect(
      areToastsEqual(baseToast({ promiseOptions }), baseToast({ promiseOptions })),
    ).toBe(true);
    expect(
      areToastsEqual(
        baseToast({ promiseOptions }),
        baseToast({
          promiseOptions: { ...promiseOptions },
        }),
      ),
    ).toBe(false);
  });

  it('compares actions by label, so a fresh onClick closure is not a change', () => {
    expect(
      areToastsEqual(
        baseToast({ action: { label: 'Undo', onClick: () => {} } }),
        baseToast({ action: { label: 'Undo', onClick: () => {} } }),
      ),
    ).toBe(true);

    expect(
      areToastsEqual(
        baseToast({ action: { label: 'Undo', onClick: () => {} } }),
        baseToast({ action: { label: 'Retry', onClick: () => {} } }),
      ),
    ).toBe(false);
  });

  it('compares a rendered action node by reference', () => {
    const action = React.createElement('Button');
    expect(areToastsEqual(baseToast({ action }), baseToast({ action }))).toBe(
      true,
    );
    expect(
      areToastsEqual(
        baseToast({ action }),
        baseToast({ action: React.createElement('Button') }),
      ),
    ).toBe(false);
  });

  it('applies the same rules to cancel', () => {
    expect(
      areToastsEqual(
        baseToast({ cancel: { label: 'Dismiss', onClick: () => {} } }),
        baseToast({ cancel: { label: 'Dismiss', onClick: () => {} } }),
      ),
    ).toBe(true);
    expect(
      areToastsEqual(
        baseToast({ cancel: { label: 'Dismiss', onClick: () => {} } }),
        baseToast({ cancel: { label: 'Close', onClick: () => {} } }),
      ),
    ).toBe(false);
  });
});

describe('isToastAction', () => {
  it('accepts a label + onClick pair', () => {
    expect(isToastAction({ label: 'Undo', onClick: () => {} })).toBe(true);
  });

  it.each<[string, unknown]>([
    ['undefined', undefined],
    ['null', null],
    ['a string', 'Undo'],
    ['a React element', React.createElement('Button')],
    ['a partial action', { label: 'Undo' }],
    ['a non-string label', { label: 7, onClick: () => {} }],
    ['a non-function onClick', { label: 'Undo', onClick: 'nope' }],
  ])('rejects %s', (_label, value) => {
    expect(isToastAction(value as React.ReactNode)).toBe(false);
  });
});
