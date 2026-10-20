import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { AuthoredAvatarEngine } from '../runtime/avatar/authored-engine';
import { bindAvatarPointer } from '../runtime/avatar/bind-pointer';
import { AVATAR_PRESETS, assetUrl, type AvatarPreset } from '../runtime/avatar/catalog';
import { AvatarMotionReview } from './AvatarMotionReview';

const meta = {
  id: 'agents-agent-avatar-new-engine',
  title: 'Labs/Avatar Runtime',
  parameters: { layout: 'fullscreen', bloomScroll: 'document' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const MotionReview: Story = { render: () => <AvatarMotionReview /> };

function FidelityLab() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const authored = useRef<AuthoredAvatarEngine | null>(null);
  const [status, setStatus] = useState('Cargando las piezas originales…');
  const [animated, setAnimated] = useState(true);
  const [frameRate, setFrameRate] = useState('60');
  const [count, setCount] = useState(1);
  const [preset, setPreset] = useState<AvatarPreset>('blue_beret');
  const [mixed, setMixed] = useState(false);
  const [selected, setSelected] = useState(0);
  const [metrics, setMetrics] = useState('');
  const [loading, setLoading] = useState(true);
  const cell = count === 1 ? 320 : 112;
  const columns = Math.min(count, 8);
  useEffect(() => {
    if (!canvas.current) return;
    const instance = new AuthoredAvatarEngine(canvas.current, { size: 320 });
    authored.current = instance;
    Object.assign(window, { __avatarFidelity: instance });
    let alive = true;
    instance.loaded
      .then(() => {
        if (alive) setStatus('Geometría, pelo y materiales originales cargados.');
      })
      .catch((error) => {
        if (alive) setStatus(String(error));
      });
    const timer = setInterval(() => setMetrics(JSON.stringify(instance.stats(), null, 2)), 1000);
    return () => {
      clearInterval(timer);
      alive = false;
      instance.dispose();
      authored.current = null;
      Object.assign(window, { __avatarFidelity: undefined });
    };
  }, []);
  useEffect(() => {
    authored.current?.setCount(count);
    setSelected((value) => Math.min(value, count - 1));
    let alive = true;
    setLoading(true);
    setStatus('Cargando los modelos y sus acciones…');
    authored.current
      ?.setSize(cell)
      .then(async () => {
        if (!alive) return;
        await authored.current?.setPresets(mixed ? AVATAR_PRESETS : [preset]);
        if (alive) {
          setLoading(false);
          setStatus('Geometría, pelo, materiales y acciones originales cargados.');
        }
      })
      .catch((error) => {
        if (alive) setStatus(String(error));
      });
    return () => {
      alive = false;
    };
  }, [count, cell, preset, mixed]);
  useEffect(() => {
    authored.current?.setPaused(!animated);
    if (!canvas.current || !authored.current) return;
    return bindAvatarPointer(canvas.current, authored.current, {
      enabled: animated,
      onSelect: setSelected,
    });
  }, [animated]);
  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui',
        background: '#f5f5f2',
        color: '#26333d',
        minHeight: '100vh',
      }}
    >
      <h1>Fidelidad · piezas originales</h1>
      <p>
        Ocho avatares con sus mallas, pelo y materiales originales. Puedes compararlos en pose fija
        y probarlos juntos en la misma escena. Con el movimiento activo, arrastra un avatar para
        girarlo.
      </p>
      <p>
        <strong>En reconstrucción:</strong> reposo, reacción y Computer recuperados del original
        para los ocho modelos. Computer vuelve al reposo en todos. Las reacciones de los siete
        modelos personalizados también; el azul conserva la pose final del original. Siguen
        pendientes la fidelidad de todas las interrupciones, otras acciones y la combinación libre
        de piezas.
      </p>
      <p>
        <a href="?path=/story/agents-agent-avatar-new-engine--motion-review" target="_top">
          Revisar los movimientos originales de los ocho modelos, fotograma a fotograma
        </a>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setAnimated(false);
            setCount(1);
            setMixed(false);
            setSelected(0);
            authored.current?.resetAppearance();
          }}
        >
          Restablecer comparación
        </button>
        <button type="button" onClick={() => setAnimated((value) => !value)}>
          {animated ? 'Fijar pose' : 'Probar movimiento'}
        </button>
        <label>
          Cantidad{' '}
          <select
            aria-label="Copias originales"
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          >
            {[1, 4, 8, 24, 48, 100, 200].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 16 }}
      >
        <label>
          Modelo de referencia{' '}
          <select
            aria-label="Modelo original"
            value={preset}
            onChange={(event) => {
              setPreset(event.target.value as AvatarPreset);
              setMixed(false);
            }}
          >
            {AVATAR_PRESETS.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={mixed}
            onChange={(event) => setMixed(event.target.checked)}
          />{' '}
          Mezclar los ocho modelos
        </label>
        <label>
          Avatar seleccionado{' '}
          <input
            aria-label="Avatar seleccionado"
            type="number"
            min={1}
            max={count}
            value={selected + 1}
            onChange={(event) =>
              setSelected(Math.max(0, Math.min(count - 1, Number(event.target.value) - 1)))
            }
            style={{ width: 64 }}
          />
        </label>
        <label>
          Refresco{' '}
          <select
            aria-label="Límite de refresco"
            value={frameRate}
            onChange={(event) => {
              setFrameRate(event.target.value);
              authored.current?.setMaxFrameRate(
                event.target.value === 'screen' ? Infinity : Number(event.target.value),
              );
            }}
          >
            <option value="30">30 fps · ahorro</option>
            <option value="60">60 fps</option>
            <option value="screen">Sin límite · pantalla</option>
          </select>
        </label>
        <label>
          Color{' '}
          <input
            aria-label="Color del avatar seleccionado"
            type="color"
            defaultValue="#548cef"
            onChange={(event) => authored.current?.setColor(selected, event.target.value)}
          />
        </label>
        <button type="button" onClick={() => authored.current?.resetAppearance()}>
          Colores originales
        </button>
        <button
          type="button"
          disabled={loading || !authored.current?.canReact(selected)}
          onClick={() => {
            if (authored.current?.react(selected)) setAnimated(true);
          }}
        >
          Reacción original
        </button>
        <button
          type="button"
          disabled={loading || !authored.current?.canIdle(selected)}
          onClick={() => {
            if (authored.current?.idle(selected)) setAnimated(true);
          }}
        >
          Reposo original
        </button>
        <button
          type="button"
          disabled={loading || !authored.current?.canWork(selected)}
          onClick={() => {
            if (authored.current?.work(selected)) setAnimated(true);
          }}
        >
          Computer
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            for (let index = 0; index < count; index++) authored.current?.react(index);
            setAnimated(true);
          }}
        >
          Reaccionar todos
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            for (let index = 0; index < count; index++) authored.current?.work(index);
            setAnimated(true);
          }}
        >
          Computer todos
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            for (let index = 0; index < count; index++) authored.current?.work(index, true);
            setAnimated(true);
          }}
        >
          Computer continuo todos
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            for (let index = 0; index < count; index++) {
              if (index % 3 === 0) authored.current?.work(index);
              else if (index % 3 === 1) authored.current?.react(index);
              else authored.current?.idle(index);
            }
            setAnimated(true);
          }}
        >
          Acciones mezcladas
        </button>
      </div>
      <p role="status">{status}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <figure style={{ margin: 0 }}>
          <figcaption>Original · captura de referencia</figcaption>
          <img
            src={assetUrl(preset, 'reference.png')}
            width={320}
            height={320}
            alt="Avatar original en la pose de comparación"
          />
        </figure>
        <figure style={{ margin: 0, maxWidth: '100%', overflowX: 'auto' }}>
          <figcaption>Motor nuevo · 3D en tiempo real</figcaption>
          <canvas
            ref={canvas}
            aria-label="Avatar con geometría original"
            style={{
              touchAction: animated ? 'none' : 'auto',
              width: columns * cell,
              height: Math.ceil(count / columns) * cell,
              display: 'block',
            }}
          />
        </figure>
      </div>
      <details style={{ marginTop: 16 }}>
        <summary>Mediciones de la escena</summary>
        <pre style={{ maxHeight: 320, overflow: 'auto', fontSize: 12 }}>{metrics}</pre>
      </details>
    </main>
  );
}
export const Fidelity: Story = { render: () => <FidelityLab /> };
