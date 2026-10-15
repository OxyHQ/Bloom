import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { characterHtml } from './character-html';
import { characterWebView, type CharacterWebViewHandle } from './character-webview';
import type { StillJob } from './character-still';

const TIMEOUT_MS = 20_000;

export type NativeStillJob = StillJob & { done(uri: string | null): void };

/**
 * Native's drawing surface for stills: ONE hidden WebView, mounted only while a render is queued,
 * that draws the paused portrait, hands back a PNG and goes away. A WebView per row would be a
 * GL context per row; this is one at a time, whatever the list length. Mounted by
 * `AgentAvatarProvider`; renders nothing while idle.
 */
export function CharacterStillHost({ job }: { job: NativeStillJob | null }) {
  if (!job) return null;
  return <StillRender key={job.key} job={job} />;
}

function StillRender({ job }: { job: NativeStillJob }) {
  const WebView = characterWebView();
  const ref = useRef<CharacterWebViewHandle>(null);
  const finished = useRef(false);
  const latest = useRef(job);
  latest.current = job;
  const finish = (uri: string | null) => {
    if (finished.current) return;
    finished.current = true;
    latest.current.done(uri);
  };
  useEffect(() => {
    if (!WebView) finish(null);
    const timer = setTimeout(() => finish(null), TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
      finish(null);
    };
    // The job is keyed: one render per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const source = useRef({
    html: characterHtml(job.runtimeUrl, {
      character: job.character,
      paused: true,
      portrait: true,
      reduced: true,
    }),
    baseUrl: job.runtimeUrl,
  });
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
        width: job.css,
        height: job.css,
        opacity: 0.01,
      }}
    >
      <WebView
        ref={ref}
        source={source.current}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        javaScriptEnabled
        originWhitelist={['*']}
        onMessage={(event) => {
          const data = event.nativeEvent.data;
          if (data === 'ready') ref.current?.injectJavaScript('window.captureAvatar?.(1); true;');
          else if (data === 'error') finish(null);
          else if (data.startsWith('snapshot:')) {
            try {
              const { uri } = JSON.parse(data.slice(9));
              finish(
                typeof uri === 'string' && uri.startsWith('data:image/png;base64,') ? uri : null,
              );
            } catch {
              finish(null);
            }
          }
        }}
      />
    </View>
  );
}
