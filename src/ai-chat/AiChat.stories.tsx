import React, { useState } from 'react';
import { View } from 'react-native';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { CodeBlock } from '../code';
import { ComposerLoader } from '../composer-loader';
import { ComposerPill, ComposerStatusBar } from '../composer-panel';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  AiChatAssistantMessage,
  AiChatBullet,
  AiChatBulletList,
  AiChatCodePanel,
  AiChatContainer,
  AiChatFeedbackRow,
  AiChatGalleryPanel,
  AiChatImageGeneration,
  AiChatLinkChip,
  AiChatMessageLine,
  AiChatResizeHandle,
  AiChatStrong,
  AiChatThread,
  AiChatUserMessage,
} from './index';
import type { AiChatGeneration } from './types';

const meta: Meta = {
  parameters: { controls: { disable: true } },
  title: 'Blocks/AI Chat',
};

export default meta;

type Story = StoryObj;

const SNIPPET = `const nextTheme = theme === "dark" ? "light" : "dark";

document.documentElement.classList.toggle(
  "dark",
  nextTheme === "dark",
);
localStorage.setItem("app:theme", nextTheme);`;

const PANEL_CODE = `import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Home Dashboard Template",
};

const PREVIEW_CODE = \`<DashboardShell />\`;

export default function HomeDashboardDetail() {
  return (
    <ComponentDetail
      wide
      title="Home Dashboard"
      previewCode={PREVIEW_CODE}
    />
  );
}`;

/** A blue gradient, standing in for generated artwork. */
const ARTWORK = {
  uri: 'data:image/svg+xml;utf8,' +
    encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="250"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f7cc9"/><stop offset="1" stop-color="#9ab7e8"/></linearGradient></defs><rect width="200" height="250" fill="url(#g)"/></svg>'),
};

/** Turns in a thread: the user card, and replies built from lines, bullets, a link chip and a code card. */
export const Messages: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ maxWidth: '100%', width: 718, gap: 12 }}>
      <AiChatUserMessage>
        <AiChatMessageLine>
          make detail screens like this for the home and medical templates:{' '}
          <AiChatLinkChip>figma.com/project/hse82s...</AiChatLinkChip> you can increase the max width of the detail page
        </AiChatMessageLine>
      </AiChatUserMessage>
      <AiChatAssistantMessage>
        <AiChatMessageLine tone="secondary">Worked for 5m 32s</AiChatMessageLine>
        <AiChatMessageLine>Both template detail pages are live, in the style defined in Figma.</AiChatMessageLine>
        <AiChatBulletList>
          <AiChatBullet>
            <AiChatStrong>New pages</AiChatStrong> — /components/home-dashboard and /components/medical-profile.
          </AiChatBullet>
          <AiChatBullet>
            <AiChatStrong>Wider layout</AiChatStrong> — the detail shell grows from 1200px to 1560px.
          </AiChatBullet>
        </AiChatBulletList>
      </AiChatAssistantMessage>
      <AiChatAssistantMessage>
        <AiChatMessageLine>The toggle updates the root theme from one place and persists the selection:</AiChatMessageLine>
        <CodeBlock code={SNIPPET} language="tsx" filename="theme-toggle.tsx" additions={156} deletions={23} highlight={['nextTheme']} />
      </AiChatAssistantMessage>
    </View>
  ),
};

/** Like, dislike and copy; hover for the tooltips, copy for the check and "Copied!". */
export const FeedbackRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => <AiChatFeedbackRow />,
};

/** The generation frame: the dot wave and countdown for four seconds, then the radial reveal and the feedback row. */
export const ImageGeneration: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [run, setRun] = useState(0);
    return (
      <View style={{ maxWidth: '100%', width: 400, gap: 16 }}>
        <Button size="sm" onPress={() => setRun((n) => n + 1)} appearance="outline" tone="neutral">
          Generate again
        </Button>
        <AiChatImageGeneration key={run} source={ARTWORK} alt="A blue gradient" />
      </View>
    );
  },
};

/** The frame held mid-generation (`ready={false}`). */
export const ImageGenerating: Story = {
  parameters: { controls: { disable: true } },
  render: () => <AiChatImageGeneration source={ARTWORK} alt="A blue gradient" ready={false} />,
};

/** The changes / code panel with its summary card and a soft-wrapping, numbered code view. */
export const CodePanel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ height: 640, width: 410, maxWidth: '100%' }}>
      <AiChatCodePanel width="100%"
        code={PANEL_CODE}
        language="tsx"
        changeCount={12}
        additions={156}
        deletions={23}
        changedFiles={[{ path: 'app/components/button.tsx', additions: 74, status: 'New' }]}
      />
    </View>
  ),
};

const WALL: AiChatGeneration[] = [
  { id: 'a', prompt: 'Goldfish living room, surreal collage', aspectRatio: 1120 / 2000 },
  { id: 'b', prompt: 'Racing suit editorial, metallic green', aspectRatio: 1333 / 2000 },
  { id: 'c', prompt: 'Hoopoes in olive branches, gouache', aspectRatio: 1 },
  { id: 'd', prompt: 'Biker resting, watercolour manga', aspectRatio: 928 / 1232 },
  { id: 'e', prompt: 'Helmet portraits, risograph grid', aspectRatio: 1497 / 2000 },
  { id: 'f', prompt: 'Cloud crown, editorial portrait', source: ARTWORK, aspectRatio: 0.8 },
  { id: 'g', prompt: 'Nairobi Vibes, blackletter poster', aspectRatio: 1120 / 2000 },
  { id: 'h', prompt: 'Beach kid, 35mm flash', aspectRatio: 960 / 1200 },
  { id: 'i', prompt: 'Reader on pink, crayon texture', aspectRatio: 1 },
];

/**
 * The generations wall: balanced columns cascading in, a hover scrim with the
 * actions and prompt, a press lifting a tile into the full-width row. "Land a
 * generation" pins a new image at the top-left.
 */
export const GalleryPanel: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [generated, setGenerated] = useState<AiChatGeneration[]>([]);
    return (
      <View style={{ gap: 16 }}>
        <Button size="sm" onPress={() =>
            setGenerated((list) => [{ id: `new-${list.length}`, prompt: 'Fresh generation', source: ARTWORK, aspectRatio: 449 / 600 }, ...list])
          } appearance="outline" tone="neutral">
          Land a generation
        </Button>
        <View style={{ height: 640, width: 410, maxWidth: '100%' }}>
          <AiChatGalleryPanel width="100%" generations={WALL} generated={generated} />
        </View>
      </View>
    );
  },
};

/** The chat container: breadcrumb header, a thread, and the glass composer lit while `working`. */
export const Container: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [working, setWorking] = useState(false);
    return (
      <View style={{ gap: 16 }}>
        <Button size="sm" onPress={() => setWorking((w) => !w)} appearance="outline" tone="neutral">
          {working ? 'Stop working' : 'Start working'}
        </Button>
        <View style={{ maxWidth: '100%', width: 718, height: 640 }}>
          <AiChatContainer
            project="vibl coding project"
            title="coding scenario"
            working={working}
            composer={
              <>
                <ComposerLoader active={working}>
                  <ComposerPill surface={false} glass={working} models={['Composer 2.5', 'Fable 5', 'Sonnet 5']} />
                </ComposerLoader>
                <View style={{ paddingLeft: 6, paddingRight: 6 }}>
                  <ComposerStatusBar
                    branch="Main"
                    folders={[
                      { prefix: 'users/maya/', name: 'project-sea' },
                      { prefix: 'users/desktop/', name: 'vibl' },
                    ]}
                    mode="Agent"
                    context={57}
                  />
                </View>
              </>
            }>
            <AiChatThread>
              <AiChatUserMessage>
                update our colour tokens for dark mode and add a reusable theme toggle to the registry.
              </AiChatUserMessage>
            </AiChatThread>
          </AiChatContainer>
        </View>
      </View>
    );
  },
};

/** The resize grip on its own: hover the strip for the grip, drag it to report the distance. */
export const ResizeHandle: Story = {
  parameters: { controls: { disable: true } },
  render: function Render() {
    const [dx, setDx] = useState(0);
    const { colors } = useTheme();
    return (
      <View style={{ gap: 12 }}>
        <Text variant="body-medium">{`dx: ${Math.round(dx)}`}</Text>
        <View style={{ maxWidth: '100%', position: 'relative', width: 320, height: 240, borderRadius: 24, backgroundColor: colors.backgroundSecondary }}>
          <AiChatResizeHandle onResize={setDx} onResizeEnd={() => {}} />
        </View>
      </View>
    );
  },
};

/**
 * The host's own layer behind the chat: `background` is drawn above the
 * container's surface and below every turn, clipped to the same radius.
 * `surface={false}` beside it drops the container's own paint, for a
 * translucent layer that should show the page through.
 *
 * The chat has no project here either — `project` is optional, and the
 * breadcrumb is the chat's own crumb alone rather than an empty folder.
 */
export const BackgroundLayer: Story = {
  render: function Render() {
    const { colors } = useTheme();
    return (
      <View style={{ width: 720, height: 460 }}>
        <AiChatContainer
          title="no project, own wallpaper"
          surface={false}
          background={
            // Any node at all: a host's animated field, a video, a canvas. Here,
            // two washes so the layering is visible.
            <View style={{ width: '100%', height: '100%', backgroundColor: colors.backgroundSecondary }}>
              <View
                style={{
                  position: 'absolute',
                  left: -80,
                  top: -80,
                  width: 420,
                  height: 420,
                  borderRadius: 9999,
                  opacity: 0.28,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          }
          composer={<ComposerPill surface={false} />}>
          <AiChatThread>
            <AiChatUserMessage>what is behind this chat?</AiChatUserMessage>
            <AiChatAssistantMessage feedback={false}>
              <AiChatMessageLine>Your own layer — the container never paints over it.</AiChatMessageLine>
            </AiChatAssistantMessage>
          </AiChatThread>
        </AiChatContainer>
      </View>
    );
  },
};
