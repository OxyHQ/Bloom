import { useContext, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, AppState, Platform, type View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useMessages } from '../locale/messages';
import { StyledView, StyledText } from '../styles/styled-primitives';
import {
  type CharacterCapabilities,
  CharacterRuntimeContext,
  AvatarSnapshotObserver,
  type AvatarSnapshot,
} from './context';
import { characterHtml, scriptJson } from './character-html';
import { loadCharacterRuntime } from './character-runtime-module';
import { characterWebView, type CharacterWebViewHandle } from './character-webview';
import { type ResolvedAvatarCharacter, resolveAvatarCharacter } from './character';
import { AGENT_AVATAR_MESSAGES } from './messages';
import type { AgentAvatarProps } from './types';

export type RenderProps = Pick<
  AgentAvatarProps,
  | 'paused'
  | 'portrait'
  | 'workingKey'
  | 'workingCycles'
  | 'interactive'
  | 'reactionKey'
  | 'entranceKey'
> & { character: ResolvedAvatarCharacter; reduced: boolean; previewPart?: 'eyes' };
export type Controller = { update(props: RenderProps): void; dispose(): void };
export type RuntimeModule = {
  createAvatar(
    canvas: HTMLCanvasElement,
    props: RenderProps,
    callbacks: {
      onError(): void;
      onReady?(): void;
      onCapabilities?(value: CharacterCapabilities): void;
    },
  ): Promise<Controller>;
};
function WebCharacter({
  runtimeUrl,
  value,
  onError,
  onReady,
}: {
  runtimeUrl: string;
  value: RenderProps;
  onError(): void;
  onReady?(): void;
}) {
  const { reportCapabilities } = useContext(CharacterRuntimeContext);
  const observeSnapshot = useContext(AvatarSnapshotObserver);
  const report = useRef(reportCapabilities);
  report.current = reportCapabilities;
  const host = useRef<ComponentRef<typeof View> | null>(null),
    controller = useRef<Controller | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const fail = useRef(onError);
  fail.current = onError;
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => {
    const element = host.current as unknown as HTMLElement;
    if (!element || typeof document === 'undefined') return;
    let stopped = false,
      started = false;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      width: '100%',
      height: '100%',
      display: 'block',
      touchAction: 'none',
    });
    element.appendChild(canvas);
    canvasRef.current = canvas;
    const start = async () => {
      if (started || stopped) return;
      started = true;
      try {
        const module = await loadCharacterRuntime<RuntimeModule>(runtimeUrl);
        if (stopped) return;
        const instance = await module.createAvatar(canvas, latest.current, {
          onError: () => fail.current(),
          onReady: () => ready.current?.(),
          onCapabilities: (info) => report.current?.(info),
        });
        if (stopped) instance.dispose();
        else {
          controller.current = instance;
          instance.update(latest.current);
        }
      } catch {
        if (!stopped) fail.current();
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void start();
    });
    observer.observe(element);
    return () => {
      stopped = true;
      observer.disconnect();
      controller.current?.dispose();
      controller.current = null;
      if (canvasRef.current === canvas) canvasRef.current = null;
      canvas.remove();
    };
  }, [runtimeUrl]);
  useEffect(() => {
    observeSnapshot?.(async () => {
      const canvas = canvasRef.current;
      if (!controller.current || !canvas?.width || !canvas.height) return null;
      try {
        return { uri: canvas.toDataURL('image/png') };
      } catch {
        return null;
      }
    });
    return () => observeSnapshot?.(null);
  }, [observeSnapshot]);
  useEffect(() => {
    try {
      controller.current?.update(value);
    } catch {
      onError();
    }
  }, [value, onError]);
  return <StyledView ref={host} style={{ flex: 1 }} />;
}
function NativeCharacter({
  runtimeUrl,
  value,
  onError,
  onReady,
}: {
  runtimeUrl: string;
  value: RenderProps;
  onError(): void;
  onReady?(): void;
}) {
  const { reportCapabilities } = useContext(CharacterRuntimeContext);
  const observeSnapshot = useContext(AvatarSnapshotObserver);
  const WebView = characterWebView();
  const ref = useRef<CharacterWebViewHandle>(null);
  const captures = useRef(new Map<number, (snapshot: AvatarSnapshot | null) => void>());
  const nextCapture = useRef(0);
  useEffect(() => {
    observeSnapshot?.(
      () =>
        new Promise((resolve) => {
          if (!ref.current) {
            resolve(null);
            return;
          }
          const id = ++nextCapture.current;
          const timer = setTimeout(() => {
            captures.current.delete(id);
            resolve(null);
          }, 1000);
          captures.current.set(id, (snapshot) => {
            clearTimeout(timer);
            resolve(snapshot);
          });
          try {
            ref.current.injectJavaScript(`window.captureAvatar?.(${id}); true;`);
          } catch {
            captures.current.get(id)?.(null);
            captures.current.delete(id);
          }
        }),
    );
    return () => {
      observeSnapshot?.(null);
      for (const finish of captures.current.values()) finish(null);
      captures.current.clear();
    };
  }, [observeSnapshot, runtimeUrl]);
  const initial = useRef(value);
  const source = useMemo(
    () => ({
      html: characterHtml(runtimeUrl, initial.current),
      baseUrl: runtimeUrl,
    }),
    [runtimeUrl],
  );
  useEffect(() => {
    if (!WebView) onError();
  }, [WebView, onError]);
  const send = () =>
    ref.current?.injectJavaScript(`window.updateCharacter?.(${scriptJson(value)}); true;`);
  useEffect(send, [value]);
  if (!WebView) return null;
  return (
    <WebView
      ref={ref}
      source={source}
      style={{ flex: 1, backgroundColor: 'transparent' }}
      scrollEnabled={false}
      javaScriptEnabled
      originWhitelist={['*']}
      onMessage={(event) => {
        if (event.nativeEvent.data.startsWith('snapshot:')) {
          try {
            const { id, uri } = JSON.parse(event.nativeEvent.data.slice(9));
            captures.current.get(id)?.(
              typeof uri === 'string' && uri.startsWith('data:image/png;base64,') ? { uri } : null,
            );
            captures.current.delete(id);
          } catch {
            /* Invalid capture must not break the live avatar. */
          }
        } else if (event.nativeEvent.data.startsWith('capabilities:')) {
          try {
            reportCapabilities?.(JSON.parse(event.nativeEvent.data.slice(13)));
          } catch {
            onError();
          }
        } else if (event.nativeEvent.data === 'ready') onReady?.();
        else if (event.nativeEvent.data === 'error') onError();
        else if (event.nativeEvent.data === 'loaded') send();
      }}
    />
  );
}

/** Single character renderer. Web defaults to the hosted module; native uses its configured URL. */
export function CharacterAvatar(props: AgentAvatarProps & { previewPart?: 'eyes' }) {
  const { runtimeUrl } = useContext(CharacterRuntimeContext);
  const { messages } = useMessages(AGENT_AVATAR_MESSAGES, props.locale);
  const initialReduced = useReducedMotion();
  const [reduced, setReduced] = useState(initialReduced);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const [failed, setFailed] = useState(false);
  const {
    character,
    paused,
    portrait,
    workingKey,
    reactionKey,
    entranceKey,
    workingCycles,
    interactive,
    size = 64,
  } = props;
  useEffect(() => {
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const state = AppState.addEventListener('change', (next) => setActive(next === 'active'));
    const media =
      Platform.OS === 'web' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined;
    const change = () => setReduced(media!.matches);
    media?.addEventListener('change', change);
    if (media) change();
    return () => {
      motion?.remove?.();
      state?.remove?.();
      media?.removeEventListener('change', change);
    };
  }, []);
  // The one place a character becomes what the renderer takes; an invalid one throws here,
  // at the component that was handed it, not later inside the engine.
  const resolved = useMemo(() => resolveAvatarCharacter(character), [character]);
  useEffect(() => setFailed(false), [runtimeUrl, resolved]);
  const value = useMemo(
    () => ({
      character: resolved,
      paused: paused || !active,
      portrait,
      previewPart: props.previewPart,
      workingKey,
      reactionKey,
      entranceKey,
      workingCycles,
      interactive,
      reduced,
    }),
    [
      resolved,
      paused,
      portrait,
      props.previewPart,
      active,
      workingKey,
      reactionKey,
      entranceKey,
      workingCycles,
      interactive,
      reduced,
    ],
  );
  const fail = useMemo(() => () => setFailed(true), []);
  const Renderer = Platform.OS === 'web' ? WebCharacter : NativeCharacter;
  return (
    <StyledView
      className={props.className}
      style={[{ width: size, height: size }, props.style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={props.accessibilityLabel ?? props.label ?? messages.label}
      testID={props.testID}
    >
      {runtimeUrl && !failed ? (
        <Renderer runtimeUrl={runtimeUrl} value={value} onError={fail} onReady={props.onReady} />
      ) : (
        <StyledText numberOfLines={2} style={{ fontSize: 10 }}>
          {!runtimeUrl ? messages.runtimeRequired : messages.unavailable}
        </StyledText>
      )}
    </StyledView>
  );
}
