import React, { useEffect, useRef, useState } from 'react';
import { AVATAR_PRESETS, type AvatarPreset } from '../runtime/avatar/catalog';
import {
  createObservationReview,
  loadObservationReview,
  type ObservationReview,
} from '../runtime/avatar/observation-review';

export function AvatarMotionReview() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<ReturnType<typeof createObservationReview> | null>(null);
  const timer = useRef(0);
  const cursor = useRef(0);
  const [preset, setPreset] = useState<AvatarPreset>('lime_frog');
  const [name, setName] = useState<'idle' | 'reaction'>('reaction');
  const [data, setData] = useState<ObservationReview | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('Cargando captura…');
  const stop = () => {
    cancelAnimationFrame(timer.current);
    timer.current = 0;
    setPlaying(false);
  };
  const seek = (seconds: number) => {
    cursor.current = seconds;
    player.current?.seek(seconds);
    setTime(seconds);
  };
  useEffect(() => {
    let alive = true;
    let instance: ReturnType<typeof createObservationReview> | null = null;
    stop();
    setData(null);
    setStatus('Cargando captura…');
    loadObservationReview(preset, name)
      .then(async (next) => {
        if (!alive || !canvas.current) return;
        instance = createObservationReview(canvas.current, next);
        await instance.engine.loaded;
        if (!alive) return;
        player.current = instance;
        Object.assign(window, { __avatarMotionReview: { ...instance, data: next } });
        setData(next);
        seek(0);
        setStatus('Captura lista. Puedes recorrer cada fotograma.');
      })
      .catch((error) => {
        if (alive) setStatus(String(error));
      });
    return () => {
      alive = false;
      cancelAnimationFrame(timer.current);
      instance?.engine.dispose();
      player.current = null;
      Object.assign(window, { __avatarMotionReview: undefined });
    };
  }, [preset, name]);
  useEffect(() => {
    const changed = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  const play = () => {
    if (!data) return;
    stop();
    const start = cursor.current >= data.clip.duration ? 0 : cursor.current;
    const began = performance.now();
    let painted = 0;
    setPlaying(true);
    const tick = (now: number) => {
      const next = Math.min(data.clip.duration, start + (now - began) / 1000);
      if (now - painted >= 1000 / 60 - 1 || next === data.clip.duration) {
        seek(next);
        painted = now;
      }
      if (next < data.clip.duration) timer.current = requestAnimationFrame(tick);
      else {
        timer.current = 0;
        setPlaying(false);
        setStatus('Fin del tramo observado; no implica el final de la acción original.');
      }
    };
    timer.current = requestAnimationFrame(tick);
  };
  const reference = data?.checkpoints.find((point) => Math.abs(point.time - time) < 1e-8);
  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui',
        color: '#26333d',
        background: '#f5f5f2',
        minHeight: '100vh',
      }}
    >
      <h1>Revisión del movimiento original</h1>
      <p>
        Tramos observados del motor original, reproducidos con geometría 3D en el motor nuevo. Cada
        tramo se reproduce una sola vez.
      </p>
      <p>
        <strong>En revisión:</strong> estas capturas no sustituyen todavía los ciclos completos, las
        interrupciones ni las transiciones entre acciones.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <label>
          Avatar{' '}
          <select
            aria-label="Avatar de la captura"
            value={preset}
            onChange={(e) => setPreset(e.target.value as AvatarPreset)}
          >
            {AVATAR_PRESETS.map((id) => (
              <option key={id} value={id}>
                {id.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label>
          Movimiento{' '}
          <select
            aria-label="Movimiento observado"
            value={name}
            onChange={(e) => setName(e.target.value as 'idle' | 'reaction')}
          >
            <option value="idle">Reposo</option>
            <option value="reaction">Reacción</option>
          </select>
        </label>
        <button type="button" disabled={!data} onClick={playing ? stop : play}>
          {playing ? 'Pausar tramo' : 'Reproducir tramo'}
        </button>
        <button
          type="button"
          disabled={!data}
          onClick={() => {
            stop();
            seek(0);
          }}
        >
          Inicio
        </button>
      </div>
      <label style={{ display: 'block', marginTop: 16 }}>
        Tiempo {time.toFixed(3)} / {data?.clip.duration.toFixed(3) ?? '—'} s
        <input
          aria-label="Tiempo del tramo"
          type="range"
          min={0}
          max={data?.clip.duration ?? 1}
          step={1 / 60}
          value={time}
          disabled={!data}
          onChange={(e) => {
            stop();
            seek(Number(e.target.value));
          }}
          style={{ width: '100%', maxWidth: 656, display: 'block' }}
        />
      </label>
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {data?.checkpoints.map((point) => (
          <button
            type="button"
            key={point.time}
            onClick={() => {
              stop();
              seek(point.time);
            }}
          >
            Comparar {point.time.toFixed(3)} s
          </button>
        ))}
      </div>
      <p role="status">{status}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <p>Original · mismo instante</p>
          <div style={{ width: 320, height: 320 }}>
            {reference ? (
              <img
                src={reference.image}
                alt="Fotograma original sincronizado"
                width={320}
                height={320}
              />
            ) : (
              <p>Selecciona «Comparar» para mostrar el fotograma original de ese instante.</p>
            )}
          </div>
        </div>
        <div>
          <p>Motor nuevo · 3D en tiempo real</p>
          <canvas
            key={`${preset}:${name}`}
            ref={canvas}
            aria-label="Movimiento original reconstruido"
            style={{ width: 320, height: 320, display: 'block' }}
          />
        </div>
      </div>
      <p>
        <a href="?path=/story/application-agent-avatar-new-engine--fidelity" target="_top">
          Volver a la prueba de muchos avatares
        </a>
      </p>
    </main>
  );
}
