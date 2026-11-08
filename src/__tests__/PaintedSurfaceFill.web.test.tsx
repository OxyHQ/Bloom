/** @jest-environment jsdom */
import { act, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { usePaintedSurfaceFill } from '../surface/use-painted-surface-fill';
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
function Probe({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const color = usePaintedSurfaceFill(ref, 'rgb(243, 225, 235)', enabled);
  return (
    <div ref={ref} data-testid="fill">
      {color}
    </div>
  );
}
it('uses actual nearest baked paint and updates when the owner rebakes', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <div>
        <div
          data-bloom-paint-layer=""
          data-bloom-material="baked"
          style={{ '--bloom-surface-baked-body': 'rgb(245, 226, 237)' } as React.CSSProperties}
        />
        <Probe />
      </div>,
    ),
  );
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(245, 226, 237)');
  const layer = host.querySelector('[data-bloom-paint-layer]') as HTMLElement;
  await act(async () => {
    layer.style.setProperty('--bloom-surface-baked-body', 'rgb(30, 35, 40)');
    await Promise.resolve();
  });
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(30, 35, 40)');
  await act(async () => {
    layer.removeAttribute('data-bloom-material');
    await Promise.resolve();
  });
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(243, 225, 235)');
  await act(async () => root.unmount());
  host.remove();
});
it('does not use a distant baked ancestor behind a nearer live material', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <div>
        <div
          data-bloom-paint-layer=""
          data-bloom-material="baked"
          style={{ '--bloom-surface-baked-body': 'rgb(1, 2, 3)' } as React.CSSProperties}
        />
        <div>
          <div data-bloom-paint-layer="" />
          <Probe />
        </div>
      </div>,
    ),
  );
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(243, 225, 235)');
  await act(async () => root.unmount());
  host.remove();
});

it('keeps explicit fills unless opted in and stops at opaque ordinary panels', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const paint = (
    <div
      data-bloom-paint-layer=""
      data-bloom-material="baked"
      style={{ '--bloom-surface-baked-body': 'rgb(1, 2, 3)' } as React.CSSProperties}
    />
  );
  await act(async () =>
    root.render(
      <div>
        {paint}
        <Probe enabled={false} />
      </div>,
    ),
  );
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(243, 225, 235)');
  await act(async () =>
    root.render(
      <div>
        {paint}
        <div style={{ backgroundColor: 'rgb(243, 225, 235)' }}>
          <Probe />
        </div>
      </div>,
    ),
  );
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(243, 225, 235)');
  await act(async () => root.unmount());
  host.remove();
});
it('clears stale paint when the owner layer is replaced without rerendering the consumer', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <div>
        <div
          data-bloom-paint-layer=""
          data-bloom-material="baked"
          style={{ '--bloom-surface-baked-body': 'rgb(1, 2, 3)' } as React.CSSProperties}
        />
        <Probe />
      </div>,
    ),
  );
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(1, 2, 3)');
  await act(async () => {
    const old = host.querySelector('[data-bloom-paint-layer]')!;
    const replacement = document.createElement('div');
    replacement.setAttribute('data-bloom-paint-layer', '');
    old.replaceWith(replacement);
    await Promise.resolve();
  });
  expect(host.querySelector('[data-testid=fill]')?.textContent).toBe('rgb(243, 225, 235)');
  await act(async () => root.unmount());
  host.remove();
});
