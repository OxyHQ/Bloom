import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { AgentProgress } from '../../src/agent-progress';
import {
  AiChatAssistantMessage,
  AiChatBullet,
  AiChatBulletList,
  AiChatCodePanel,
  AiChatContainer,
  AiChatGalleryPanel,
  AiChatImageGeneration,
  AiChatLinkChip,
  AiChatMessageLine,
  AiChatMobileHeader,
  AiChatShell,
  AiChatStrong,
  AiChatThread,
  AiChatUserMessage,
  type AiChatGeneration,
} from '../../src/ai-chat';
import { CodeBlock } from '../../src/code';
import { ComposerLoader } from '../../src/composer-loader';
import { ComposerPill, ComposerStatusBar } from '../../src/composer-panel';
import { RiCodeSLine, RiGalleryLine } from '../../src/icons/remix';
import { Sidebar } from '../../src/sidebar';
import { TEMPLATE_FRAME } from '../shared/dashboard';
import {
  ACCOUNT,
  CODING_RESPONSE_CODE,
  GALLERY_WALL,
  GENERATED_IMAGE,
  GENERATED_IMAGE_ALT,
  LOCAL_FOLDERS,
  MODELS,
  NAV_ITEMS,
  PANEL_CODE,
  PLAN,
  REPOSITORIES,
  SCENARIOS,
  SECONDARY_ITEMS,
  type AiChatScenario,
} from './demo-data';

/** Beat between the image landing in the thread and it surfacing in the gallery. */
const GALLERY_REVEAL_DELAY_MS = 900;

/** The React mark on the changed-file row (a raw Figma raster, no token). */
function ReactLogo() {
  return (
    <Svg width={16} height={14.25} viewBox="0 0 16 15">
      <G stroke="#149ECA" strokeWidth={0.9} fill="none">
        <Ellipse cx={8} cy={7.125} rx={7.2} ry={2.85} />
        <Ellipse cx={8} cy={7.125} rx={7.2} ry={2.85} transform="rotate(60 8 7.125)" />
        <Ellipse cx={8} cy={7.125} rx={7.2} ry={2.85} transform="rotate(120 8 7.125)" />
      </G>
      <Circle cx={8} cy={7.125} r={1.4} fill="#149ECA" />
    </Svg>
  );
}

/** The landing-page thread, one entry per turn. */
function landingPageMessages(): { id: string; node: React.ReactNode }[] {
  return [
    {
      id: 'a1',
      node: (
        <AiChatAssistantMessage>
          <AiChatMessageLine>Both changes are in:</AiChatMessageLine>
          <AiChatBulletList>
            <AiChatBullet>
              <AiChatStrong>Sidebar PRO badge</AiChatStrong> — swapped the blue gradient for the minimal treatment: grey
              bg-background-tertiary-default with text-text-secondary. Since ProBadge is only used in the docs sidebar
              (the gallery cards have their own tier styling), this was a safe global restyle.
            </AiChatBullet>
          </AiChatBulletList>
          <AiChatMessageLine>
            One implementation note: the framework tabs needed a small client wrapper
            (app/installation/framework-tabs.tsx) because icon components can&apos;t be passed from a server page
            across the client boundary — the step content itself stays server-rendered so componentSource still works.
          </AiChatMessageLine>
          <AiChatMessageLine>
            Verified: the page returns 200 on the dev server, the redirect works, and the full production build passes
            cleanly. Happy to push when you&apos;re ready.
          </AiChatMessageLine>
        </AiChatAssistantMessage>
      ),
    },
    {
      id: 'u1',
      node: (
        <AiChatUserMessage>
          <AiChatMessageLine>
            make detail screens like this for home and medical profile templates:{' '}
            <AiChatLinkChip>figma.com/project/hse82s...</AiChatLinkChip> you can increase max width of the detail page
            for this case otherwise dashboard page wouldn&apos;t fit
          </AiChatMessageLine>
        </AiChatUserMessage>
      ),
    },
    {
      id: 'a2',
      node: (
        <AiChatAssistantMessage>
          <AiChatMessageLine tone="secondary">Worked for 5m 32s</AiChatMessageLine>
          <AiChatMessageLine>Both template detail pages are live, in the style defined in Figma.</AiChatMessageLine>
          <AiChatBulletList>
            <AiChatBullet>
              <AiChatStrong>New pages</AiChatStrong> — /components/home-dashboard and /components/medical-profile, built
              with ComponentDetail: title and description, a scaled live preview of the full template (the actual
              DashboardShell / MedicalShell rendered at 80% inside a bordered frame, fully interactive), a &quot;Live
              template&quot; section linking to the full-size page under /templates/…, a &quot;What&apos;s
              included&quot; section listing everything in the package, and a Pro callout instead of install
              instructions.
            </AiChatBullet>
            <AiChatBullet>
              <AiChatStrong>Wider layout</AiChatStrong> — ComponentDetail now takes a wide prop that bumps the page shell
              from 1200px to 1560px (main column 900px → 1220px), so the dashboards fit without heavy downscaling.
              Regular component pages are unchanged.
            </AiChatBullet>
          </AiChatBulletList>
          <AiChatMessageLine>
            Both pages return 200 on the dev server and lints are clean. Take a look — happy to adjust the preview scale
            or frame height, and to push when you&apos;re ready.
          </AiChatMessageLine>
        </AiChatAssistantMessage>
      ),
    },
    {
      id: 'u2',
      node: (
        <AiChatUserMessage>
          <AiChatMessageLine>
            looks great! add both templates to the docs sidebar under a new Templates group and push everything to main
          </AiChatMessageLine>
        </AiChatUserMessage>
      ),
    },
    {
      id: 'a3',
      node: (
        <AiChatAssistantMessage>
          <AiChatMessageLine tone="secondary">Worked for 1m 48s</AiChatMessageLine>
          <AiChatMessageLine>
            Done — the docs sidebar now has a <AiChatStrong>Templates</AiChatStrong> group listing Home Dashboard and
            Medical Profile with PRO badges, and the components gallery got a matching section. Everything is committed
            and pushed to main; the Vercel build went through cleanly.
          </AiChatMessageLine>
        </AiChatAssistantMessage>
      ),
    },
  ];
}

/** The coding reply: a paragraph and the code card. */
function CodingResponse() {
  return (
    <AiChatAssistantMessage>
      <AiChatMessageLine>
        Done — the semantic dark-mode tokens and reusable theme toggle are wired. The toggle updates the root theme from
        one place and persists the selection:
      </AiChatMessageLine>
      <CodeBlock
        code={CODING_RESPONSE_CODE}
        language="tsx"
        filename="theme-toggle.tsx"
        additions={156}
        deletions={23}
        highlight={['nextTheme']}
      />
    </AiChatAssistantMessage>
  );
}

/**
 * The progress block leaving and the reply arriving: the steps collapse, rise
 * 6px and blur out (280ms), then the reply rises 8px in un-blurring (380ms).
 */
function WorkSwap({ finished, onFinished }: { finished: boolean; onFinished: () => void }) {
  const [shown, setShown] = useState<'steps' | 'response'>(finished ? 'response' : 'steps');
  const leave = useSharedValue(0);
  const enter = useSharedValue(0);
  const height = useSharedValue(0);
  useEffect(() => {
    if (!finished || shown === 'response') return;
    leave.value = withTiming(1, { duration: 280, easing: Easing.bezier(0.4, 0, 1, 1) });
    const timer = setTimeout(() => {
      setShown('response');
      enter.value = withTiming(1, { duration: 380, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    }, 280);
    return () => clearTimeout(timer);
  }, [finished, shown, leave, enter]);
  const stepsStyle = useAnimatedStyle(
    () => ({
      opacity: 1 - leave.value,
      transform: [{ translateY: -6 * leave.value }],
      height: leave.value > 0 ? height.value * (1 - leave.value) : 'auto',
      filter: leave.value > 0 ? `blur(${6 * leave.value}px)` : 'none',
    }),
    [leave, height],
  );
  const responseStyle = useAnimatedStyle(
    () => ({
      opacity: enter.value,
      transform: [{ translateY: 8 * (1 - enter.value) }],
      filter: enter.value >= 1 ? 'none' : `blur(${7 * (1 - enter.value)}px)`,
    }),
    [enter],
  );
  if (shown === 'response') {
    return (
      <Animated.View key="response" style={responseStyle}>
        <CodingResponse />
      </Animated.View>
    );
  }
  return (
    <Animated.View
      key="steps"
      onLayout={(event) => {
        if (leave.value === 0) height.value = event.nativeEvent.layout.height;
      }}
      style={[{ overflow: 'hidden' }, stepsStyle]}>
      <AgentProgress onFinished={onFinished} />
    </Animated.View>
  );
}

/** The scripted conversation: the first turn now, then one more every 2s (0.9s outside the landing thread). */
function Thread({
  scenario,
  stopped,
  onImageGenerated,
  onWorkingChange,
}: {
  scenario: AiChatScenario;
  /** The composer's stop was pressed: the scripted work ends where it is. */
  stopped: boolean;
  onImageGenerated: () => void;
  onWorkingChange: (working: boolean) => void;
}) {
  const [codingFinished, setCodingFinished] = useState(false);
  const finishCoding = useCallback(() => setCodingFinished(true), []);
  const finished = codingFinished || stopped;
  const messages =
    scenario === 'image-generation'
      ? [
          {
            id: 'image-u1',
            node: (
              <AiChatUserMessage>
                <AiChatMessageLine>
                  Create a vintage editorial illustration of Lionel Messi dribbling in Argentina&apos;s home kit against
                  a blue background.
                </AiChatMessageLine>
              </AiChatUserMessage>
            ),
          },
          {
            id: 'image-a1',
            node: (
              <AiChatImageGeneration
                source={GENERATED_IMAGE.source!}
                alt={GENERATED_IMAGE_ALT}
                onGenerated={onImageGenerated}
              />
            ),
          },
        ]
      : scenario === 'coding-scenario'
        ? [
            {
              id: 'coding-u1',
              node: (
                <AiChatUserMessage>
                  <AiChatMessageLine>
                    update our color tokens for dark mode and add a reusable theme toggle to the registry. run lint and a
                    production build when you&apos;re done.
                  </AiChatMessageLine>
                </AiChatUserMessage>
              ),
            },
            { id: 'coding-work', node: <WorkSwap finished={finished} onFinished={finishCoding} /> },
          ]
        : landingPageMessages();

  const [visibleCount, setVisibleCount] = useState(1);
  useEffect(() => {
    if (visibleCount >= messages.length) return;
    const timer = setTimeout(() => setVisibleCount((count) => count + 1), scenario === 'landing-page-design' ? 2000 : 900);
    return () => clearTimeout(timer);
  }, [messages.length, scenario, visibleCount]);

  const working = scenario === 'coding-scenario' && visibleCount >= messages.length && !finished;
  useEffect(() => {
    onWorkingChange(working);
    return () => onWorkingChange(false);
  }, [working, onWorkingChange]);

  return (
    <AiChatThread>
      {messages.slice(0, visibleCount).map((message) => (
        <View key={message.id}>{message.node}</View>
      ))}
    </AiChatThread>
  );
}

/**
 * The AI chat template: the shell, sidebar, chat container, composer and the
 * code or gallery panel, with a scripted demo in place of a model. Picking one
 * of the three scripted chats in the sidebar replays it.
 */
export function AiChatTemplate({ defaultScenario }: { defaultScenario: AiChatScenario }) {
  const [scenario, setScenario] = useState<AiChatScenario>(defaultScenario);
  const [navOpen, setNavOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [generated, setGenerated] = useState<AiChatGeneration[]>([]);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onImageGenerated = useCallback(() => {
    if (revealTimer.current) return;
    revealTimer.current = setTimeout(() => {
      revealTimer.current = null;
      setGenerated((current) => (current.some((g) => g.id === GENERATED_IMAGE.id) ? current : [GENERATED_IMAGE, ...current]));
    }, GALLERY_REVEAL_DELAY_MS);
  }, []);
  useEffect(
    () => () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    },
    [],
  );

  const selectScenario = (key: string) => {
    if ((SCENARIOS as ReadonlyArray<string>).includes(key)) {
      setScenario(key as AiChatScenario);
      setStopped(false);
      setNavOpen(false);
    }
  };

  const image = scenario === 'image-generation';
  const sidebarProps = {
    items: NAV_ITEMS,
    secondaryItems: SECONDARY_ITEMS(() => {}),
    account: ACCOUNT,
    tree: REPOSITORIES,
    selectedTreeItem: scenario,
    onTreeItemPress: (item: { key: string }) => selectScenario(item.key),
    plan: PLAN,
  };

  return (
    <View style={TEMPLATE_FRAME}>
      <AiChatShell
        sidebar={<Sidebar {...sidebarProps} />}
        mobileSidebar={<Sidebar {...sidebarProps} mobile surface="plain" />}
        navOpen={navOpen}
        onNavOpenChange={setNavOpen}
        panelLabel={image ? 'Gallery' : 'Code'}
        panelIcon={image ? RiGalleryLine : RiCodeSLine}
        panel={(width) =>
          image ? (
            <AiChatGalleryPanel
              width={width}
              generations={GALLERY_WALL}
              generated={generated}
              style={width === '100%' ? { minHeight: 0, flex: 1, height: undefined } : undefined}
            />
          ) : (
            <AiChatCodePanel
              width={width}
              code={PANEL_CODE}
              language="tsx"
              changeCount={12}
              additions={156}
              deletions={23}
              changedFiles={[{ path: 'bloom/app/components/button.tsx', additions: 74, status: 'New', icon: <ReactLogo /> }]}
              style={width === '100%' ? { minHeight: 0, flex: 1, height: undefined } : undefined}
            />
          )
        }>
        <AiChatContainer
          project="vibl coding project"
          title={scenario === 'image-generation' ? 'image generation' : scenario === 'coding-scenario' ? 'coding scenario' : 'landing page design'}
          header={<AiChatMobileHeader title={image ? 'Image generation' : 'Agentic chat'} />}
          working={working}
          composer={
            <>
              <ComposerLoader active={working}>
                {/*
                  `busy` + `onStop` is the turn-in-flight contract: send becomes
                  the stop disc, and it answers even with the rest of the
                  composer locked (`disabled`).
                */}
                <ComposerPill
                  surface={false}
                  glass={working}
                  models={MODELS}
                  defaultModel="oxy/fable-5"
                  disabled={working}
                  busy={working}
                  onStop={() => setStopped(true)}
                />
              </ComposerLoader>
              <View style={{ paddingLeft: 6, paddingRight: 6 }}>
                <ComposerStatusBar branch="Main" folders={LOCAL_FOLDERS} mode="Agent" context={57} />
              </View>
            </>
          }>
          <Thread
            key={scenario}
            scenario={scenario}
            stopped={stopped}
            onImageGenerated={onImageGenerated}
            onWorkingChange={setWorking}
          />
        </AiChatContainer>
      </AiChatShell>
    </View>
  );
}
