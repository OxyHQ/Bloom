import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { scriptJson } from './character-html';
import { characterStillHtml } from './character-still-html';
import { characterWebView, type CharacterWebViewHandle } from './character-webview';
import type { StillJob } from './character-still';

const TIMEOUT_MS = 20_000;
const LINGER_MS = 1_500;

export type NativeStillJob = StillJob & { done(uri: string | null): void };

/** One WebView for a burst of queued stills, released shortly after the queue drains. */
export function CharacterStillHost({ job }: { job: NativeStillJob | null }) {
  const [held, setHeld] = useState(job);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (job) {
      setHeld(job);
      return;
    }
    const timer = setTimeout(() => setHeld(null), LINGER_MS);
    return () => clearTimeout(timer);
  }, [job]);
  const retained = job ?? held;
  if (!retained) return null;
  return (
    <StillRender
      key={`${retained.runtimeUrl}:${revision}`}
      runtimeUrl={retained.runtimeUrl}
      job={job}
      onFailure={retry}
    />
  );
}

type Active = {
  id: number;
  job: NativeStillJob;
  finish(uri: string | null, retry?: boolean): void;
};

function StillRender({
  runtimeUrl,
  job,
  onFailure,
}: {
  runtimeUrl: string;
  job: NativeStillJob | null;
  onFailure(): void;
}) {
  const WebView = characterWebView();
  const ref = useRef<CharacterWebViewHandle>(null);
  const loaded = useRef(false);
  const broken = useRef(false);
  const active = useRef<Active | null>(null);
  const sequence = useRef(0);
  const source = useMemo(
    () => ({ html: characterStillHtml(runtimeUrl), baseUrl: runtimeUrl }),
    [runtimeUrl],
  );
  const send = useCallback(() => {
    const current = active.current;
    if (!loaded.current || !current) return;
    try {
      ref.current?.injectJavaScript(
        `window.renderStill?.(${scriptJson({
          id: current.id,
          character: current.job.character,
          css: current.job.css,
          previewPart: current.job.previewPart,
        })}); true;`,
      );
    } catch {
      current.finish(null, true);
    }
  }, []);
  useEffect(() => {
    if (!job) return;
    if (broken.current) {
      onFailure();
      return;
    }
    let finished = false;
    const current: Active = {
      id: ++sequence.current,
      job,
      finish(uri, retry = false) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (active.current === current) active.current = null;
        job.done(uri);
        if (retry) onFailure();
      },
    };
    const timer = setTimeout(() => current.finish(null, true), TIMEOUT_MS);
    active.current = current;
    if (!WebView) current.finish(null);
    else send();
    return () => {
      clearTimeout(timer);
      if (active.current === current) active.current = null;
      // React replays new effects in StrictMode. The replacement owns the same
      // job; only a real departure should settle it as failed.
      queueMicrotask(() => {
        if (active.current?.job !== job) current.finish(null);
      });
    };
  }, [job, WebView, send, onFailure]);
  const processTerminated = () => {
    broken.current = true;
    active.current?.finish(null, true);
  };
  if (!WebView) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: job?.css ?? 64,
        height: job?.css ?? 64,
        opacity: 0.01,
      }}
    >
      <WebView
        ref={ref}
        source={source}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled
        originWhitelist={['*']}
        onError={processTerminated}
        onRenderProcessGone={processTerminated}
        onContentProcessDidTerminate={processTerminated}
        onMessage={(event) => {
          const data = event.nativeEvent.data;
          if (data === 'loaded') {
            loaded.current = true;
            send();
          } else if (data === 'error') {
            broken.current = true;
            active.current?.finish(null, true);
          } else if (data.startsWith('capabilities:')) {
            try {
              const { id, value } = JSON.parse(data.slice(13));
              const current = active.current;
              if (current && current.id === id) current.job.onCapabilities?.(value);
            } catch {
              /* Invalid reports cannot supply another job's catalog. */
            }
          } else if (data.startsWith('snapshot:')) {
            try {
              const { id, uri } = JSON.parse(data.slice(9));
              if (active.current?.id !== id) return;
              active.current?.finish(
                typeof uri === 'string' && uri.startsWith('data:image/png;base64,') ? uri : null,
              );
            } catch {
              active.current?.finish(null, true);
            }
          }
        }}
      />
    </View>
  );
}
