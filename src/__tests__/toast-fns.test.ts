import React from 'react';

import { toast } from '../toast/toast-fns';
import { toastStore } from '../toast/toast-store';
import type { ToastProps, ToastType, ToastVariant } from '../toast/types';

const stored = (id: string | number): ToastProps => {
  const toastProps = toastStore.getSnapshot().toastsById.get(id);
  if (!toastProps) {
    throw new Error(`No toast in the store for id ${String(id)}`);
  }
  return toastProps;
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('toast()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    toastStore.setConfig({});
  });

  afterEach(() => {
    toastStore.dismissToast(undefined);
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('content routing', () => {
    it('treats a string as the title', () => {
      const id = toast('Saved');
      expect(stored(id)).toMatchObject({ title: 'Saved' });
      expect(stored(id).jsx).toBeUndefined();
    });

    it('treats a React element as jsx with an empty title', () => {
      const element = React.createElement('Row', null, 'custom');
      const id = toast(element);
      expect(stored(id).title).toBe('');
      expect(stored(id).jsx).toBe(element);
    });

    it.each([
      ['a number', 42, 'number'],
      ['a boolean', true, 'boolean'],
      ['null', null, 'object'],
      ['undefined', undefined, 'undefined'],
      ['an array', ['a', 'b'], 'object'],
    ])('throws for %s', (_label, content, typeName) => {
      expect(() => toast(content as React.ReactNode)).toThrow(
        `Toast can be a string or a React element, got ${typeName}`,
      );
    });
  });

  describe('type → variant', () => {
    it.each<[ToastType, ToastVariant | undefined]>([
      ['default', undefined],
      ['success', 'success'],
      ['error', 'error'],
      ['warning', 'warning'],
      ['info', 'info'],
      ['loading', 'loading'],
    ])('maps type %s to variant %s', (type, variant) => {
      const id = toast('x', { type });
      expect(stored(id).variant).toBe(variant);
    });

    it('leaves the variant absent when no type is given', () => {
      expect(stored(toast('x')).variant).toBeUndefined();
    });

    it('never leaks the public `type` key into the stored toast', () => {
      const id = toast('x', { type: 'success' });
      expect('type' in stored(id)).toBe(false);
    });
  });

  describe('variant shorthands', () => {
    const shorthands = {
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      loading: toast.loading,
    };

    it.each<[keyof typeof shorthands, ToastVariant]>([
      ['success', 'success'],
      ['error', 'error'],
      ['warning', 'warning'],
      ['info', 'info'],
      ['loading', 'loading'],
    ])('toast.%s sets variant %s', (method, variant) => {
      const id = shorthands[method]('x');
      expect(stored(id).variant).toBe(variant);
    });

    it('forwards the remaining options', () => {
      const onDismiss = jest.fn();
      const id = toast.success('x', { duration: 1234, onDismiss, id: 'mine' });
      expect(stored(id)).toMatchObject({
        id: 'mine',
        duration: 1234,
        variant: 'success',
      });
      expect(stored(id).onDismiss).toBe(onDismiss);
    });
  });

  describe('toast.custom', () => {
    it('stores the element as jsx with no variant', () => {
      const element = React.createElement('Row', null, 'custom');
      const id = toast.custom(element);
      expect(stored(id)).toMatchObject({ title: '', jsx: element });
      expect(stored(id).variant).toBeUndefined();
    });

    it('keeps action and description available to the renderer', () => {
      const onClick = jest.fn();
      const id = toast.custom(React.createElement('Row'), {
        description: 'details',
        action: { label: 'Undo', onClick },
      });
      expect(stored(id)).toMatchObject({
        description: 'details',
        action: { label: 'Undo', onClick },
      });
    });
  });

  describe('toast.promise', () => {
    it('shows the loading title first, then the formatted success title', async () => {
      const id = toast.promise(Promise.resolve({ name: 'Nate' }), {
        loading: 'Saving…',
        success: (result) => `Saved ${result.name}`,
        error: 'Failed',
      });

      expect(stored(id)).toMatchObject({
        title: 'Saving…',
        variant: 'loading',
      });
      expect(stored(id).promiseOptions).toBeDefined();

      await flushMicrotasks();

      expect(stored(id)).toMatchObject({
        title: 'Saved Nate',
        variant: 'success',
      });
    });

    it('formats the rejection through the error callback', async () => {
      const id = toast.promise(Promise.reject(new Error('offline')), {
        loading: 'Saving…',
        success: () => 'Saved',
        error: (error) =>
          `Failed: ${error instanceof Error ? error.message : 'unknown'}`,
      });

      await flushMicrotasks();

      expect(stored(id)).toMatchObject({
        title: 'Failed: offline',
        variant: 'error',
      });
    });

    it('forwards the remaining options and the loading styles', async () => {
      const loadingStyles = { title: { fontSize: 11 } };
      const id = toast.promise(Promise.resolve('ok'), {
        id: 'job',
        duration: 2500,
        loading: 'Saving…',
        success: (result) => result,
        error: 'Failed',
        styles: { loading: loadingStyles },
      });

      expect(id).toBe('job');
      expect(stored(id)).toMatchObject({ duration: 2500 });
      expect(stored(id).styles).toBe(loadingStyles);

      await flushMicrotasks();
      expect(stored(id).title).toBe('ok');
    });
  });

  describe('return values', () => {
    it('hands back the store id from every method', () => {
      expect(toast('a')).toBe(1);
      expect(toast.success('b')).toBe(2);
      expect(toast.error('c')).toBe(3);
      expect(toast.warning('d')).toBe(4);
      expect(toast.info('e')).toBe(5);
      expect(toast.loading('f')).toBe(6);
      expect(toast.custom(React.createElement('Row'))).toBe(7);
      expect(
        toast.promise(Promise.resolve('x'), {
          loading: 'l',
          success: (r) => r,
          error: 'e',
        }),
      ).toBe(8);
    });

    it('respects a caller-supplied id', () => {
      expect(toast('a', { id: 'mine' })).toBe('mine');
    });

    it('dismiss returns the id it dismissed, and nothing for dismiss-all', () => {
      const id = toast('a');
      expect(toast.dismiss(id)).toBe(id);
      toast('b');
      expect(toast.dismiss()).toBeUndefined();
      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('wiggle returns nothing', () => {
      const id = toast('a');
      expect(toast.wiggle(id)).toBeUndefined();
    });
  });

  it('updates an existing toast in place when the same id is reused', () => {
    toast('pending', { id: 'job' });
    toast.success('done', { id: 'job' });

    const state = toastStore.getSnapshot();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toMatchObject({
      title: 'done',
      variant: 'success',
    });
  });
});
