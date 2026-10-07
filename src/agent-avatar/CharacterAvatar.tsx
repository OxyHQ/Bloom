import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Platform, type View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useMessages } from '../locale/messages';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { type CharacterCapabilities, CharacterRuntimeContext } from './context';
import { characterHtml, scriptJson } from './character-html';
import { loadCharacterRuntime } from './character-runtime-module';
import {
  characterWebView,
  type CharacterWebViewHandle,
} from './character-webview';
import { legacyRecipe } from './legacy-recipe';
import { isMigratedCharacterShape } from './character-shapes';
import { AGENT_AVATAR_MESSAGES } from './messages';
import type { AgentAvatarProps } from './types';

type RenderProps = Pick<
  AgentAvatarProps,
  | 'config'
  | 'paused'
  | 'portrait'
  | 'workingKey'
  | 'workingCycles'
  | 'interactive'
  | 'reactionKey'
  | 'entranceKey'
> & { reduced: boolean; legacy?: ReturnType<typeof legacyRecipe> };
type Controller = { update(props: RenderProps): void; dispose(): void };
type RuntimeModule = {
  createAvatar(
    canvas: HTMLCanvasElement,
    props: RenderProps,
    callbacks: {
      onError(): void;
      onCapabilities?(value: CharacterCapabilities): void;
    },
  ): Promise<Controller>;
};
function WebCharacter({
  runtimeUrl,
  value,
  onError,
}: {
  runtimeUrl: string;
  value: RenderProps;
  onError(): void;
}) {
  const { reportCapabilities } = useContext(CharacterRuntimeContext);
  const report = useRef(reportCapabilities);
  report.current = reportCapabilities;
  const host = useRef<View>(null),
    controller = useRef<Controller | null>(null);
  const latest = useRef(value);
  latest.current = value;
  const fail = useRef(onError);
  fail.current = onError;
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
    const start = async () => {
      if (started || stopped) return;
      started = true;
      try {
        const module = await loadCharacterRuntime<RuntimeModule>(runtimeUrl);
        if (stopped) return;
        const instance = await module.createAvatar(canvas, latest.current, {
          onError: () => fail.current(),
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
      canvas.remove();
    };
  }, [runtimeUrl]);
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
}: {
  runtimeUrl: string;
  value: RenderProps;
  onError(): void;
}) {
  const { reportCapabilities } = useContext(CharacterRuntimeContext);
  const WebView = characterWebView();
  const ref = useRef<CharacterWebViewHandle>(null);
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
    ref.current?.injectJavaScript(
      `window.updateCharacter?.(${scriptJson(value)}); true;`,
    );
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
        if (event.nativeEvent.data.startsWith('capabilities:')) {
          try {
            reportCapabilities?.(JSON.parse(event.nativeEvent.data.slice(13)));
          } catch {
            onError();
          }
        } else if (event.nativeEvent.data === 'error') onError();
        else if (event.nativeEvent.data === 'loaded') send();
      }}
    />
  );
}

/** Optional binary-backed renderer; the application supplies the hosted runtime URL. */
export function CharacterAvatar(props: AgentAvatarProps) {
  const { runtimeUrl } = useContext(CharacterRuntimeContext);
  const { messages } = useMessages(AGENT_AVATAR_MESSAGES, props.locale);
  const initialReduced = useReducedMotion();
  const [reduced, setReduced] = useState(initialReduced);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const [failed, setFailed] = useState(false);
  const {
    config,
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
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    const state = AppState.addEventListener('change', (next) =>
      setActive(next === 'active'),
    );
    const media =
      Platform.OS === 'web'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : undefined;
    const change = () => setReduced(media!.matches);
    media?.addEventListener('change', change);
    if (media) change();
    return () => {
      motion?.remove?.();
      state?.remove?.();
      media?.removeEventListener('change', change);
    };
  }, []);
  useEffect(() => setFailed(false), [runtimeUrl, config.character]);
  const legacy = useMemo(
    () =>
      !config.character ||
      config.character.preset === 'bloom' ||
      isMigratedCharacterShape(config.character.selections?.shape)
        ? legacyRecipe(config)
        : undefined,
    [config],
  );
  const value = useMemo(
    () => ({
      config,
      legacy,
      paused: paused || !active,
      portrait,
      workingKey,
      reactionKey,
      entranceKey,
      workingCycles,
      interactive,
      reduced,
    }),
    [
      config,
      legacy,
      paused,
      portrait,
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
      accessibilityLabel={
        props.accessibilityLabel ?? props.label ?? messages.label
      }
      testID={props.testID}
    >
      {runtimeUrl && !failed ? (
        <Renderer runtimeUrl={runtimeUrl} value={value} onError={fail} />
      ) : (
        <Text numberOfLines={2} style={{ fontSize: 10 }}>
          {messages.unavailable}
        </Text>
      )}
    </StyledView>
  );
}
