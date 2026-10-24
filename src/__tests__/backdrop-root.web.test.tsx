/** @jest-environment jsdom */
/**
 * No surface material sits on or under a backdrop root, in any state.
 *
 * The material's body and edge light are `::before`/`::after` with a
 * `backdrop-filter` (`surface/web-material.ts`). In Chromium an element with
 * `opacity` below 1, any `filter` (`blur(0px)` too), a mask, a `clip-path`, a
 * `mix-blend-mode` or its own `backdrop-filter` is the backdrop root of what is
 * under it: a material host on or under one loses its blur and edge light, for
 * as long as that lasts. A fading menu flickered flat on every open and close;
 * a tooltip whose entrance ended on `filter: blur(0px)` was flat for good.
 *
 * So hosts move with `transform` only, their layers fade through
 * `--bloom-surface-presence`, and their content fades piece by piece
 * (`surface/use-surface-presence.ts`). This renders every family that paints
 * the material at rest, pressed, disabled, opening and closing, and fails on any
 * trigger on a host or its ancestors (`support/backdrop-root.ts`). The real
 * browser check, which also sees keyframes run and hover, is
 * `scripts/verify-backdrop-root.mjs`.
 *
 * Every source file that paints the material is either rendered here or
 * classified with a reason; the census below is an equality, so a new painter
 * fails until it is one or the other.
 */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('react-native-reanimated', () => {
  const base = jest.requireActual('../../__mocks__/react-native-reanimated');
  const native = jest.requireActual('react-native-web');
  return {
    ...base,
    __esModule: true,
    default: {
      ...base.default,
      View: native.View,
      Text: native.Text,
      ScrollView: native.ScrollView,
      createAnimatedComponent: (component: unknown) => component,
    },
  };
});

import { materialHostSelector } from '../surface/web-material';
import { backdropRootViolations, materialHostCount } from './support/backdrop-root';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalOutlet, PortalProvider } from '../portal/index.web';
import { resetOverlayStack } from '../overlay/stack';
import { Button } from '../button/Button.web';
import { Card } from '../card';
import { Surface } from '../surface/Surface.web';
import { SurfacePaint } from '../surface/SurfacePaint';
import { Dialog } from '../dialog/Dialog.web';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/Popover.web';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/Tooltip.web';
import { UserHoverCard } from '../user-hover-card';
import { AgentProgress } from '../agent-progress';
import { useSurfacePresenceContent } from '../surface/use-surface-presence';
import { Admonition } from '../admonition';
import { AgentProgressPlan } from '../agent-progress';
import { Announcement } from '../announcement';
import { ProOfferCard } from '../app-shell/ProOfferCard';
import { Badge } from '../badge';
import { BlurIsland } from '../blur';
import { BottomSheet } from '../bottom-sheet/index.web';
import { CloseButton } from '../button/CloseButton';
import { UnreadBadge } from '../chat-indicators';
import { ChatInfoPanel } from '../chat-screen/index.web';
import { Checkbox } from '../checkbox';
import { Chip } from '../chip';
import { ComposerPill } from '../composer-panel/index.web';
import { ContentPanel } from '../content-panel/index.web';
import { FileUpload } from '../file-upload';
import { InputGroup } from '../input-group';
import { InputOtp } from '../input-otp';
import { MailComposeSurface } from '../mail-compose';
import { PlayButton } from '../media-controls';
import { Menubar, MenubarMenu, MenubarTrigger } from '../menubar/index.web';
import { Notification } from '../notification';
import { Pagination } from '../pagination';
import { Questionnaire } from '../questionnaire';
import { QueuePanel } from '../queue-panel/index.web';
import { RadioIndicator } from '../radio-indicator';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { Select, SelectTrigger, SelectValue } from '../select/index.web';
import { SettingsModal } from '../settings-modal/index.web';
import { ShareSheet } from '../share-sheet';
import { Sidebar } from '../sidebar';
import { Slider } from '../slider';
import { Switch } from '../switch';
import { TabBar, TabBarButton } from '../tab-bar/index.web';
import { TagField } from '../tag-field';
import { TextField, TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { ToastContent } from '../toast/ToastContent';
import { RiHomeLine } from '../icons/remix/RiHomeLine';
import { RiLinkM } from '../icons/remix/RiLinkM';
import { RiSettings6Line } from '../icons/remix/RiSettings6Line';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type State = 'rest' | 'pressed' | 'disabled' | 'opening' | 'closing';

interface Subject {
  /** Rendered with `open` false only for `closing`, after a settled open. */
  render: (props: { state: State; open: boolean }) => React.ReactElement;
  states: State[];
  /** States in which the family is flat by design: no material host at all. */
  flat?: State[];
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  jest.useFakeTimers();
  resetOverlayStack();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetOverlayStack();
  jest.useRealTimers();
});

function mount(element: React.ReactElement) {
  act(() =>
    root.render(
      <BloomThemeProvider fonts={false} mode="light">
        <PortalProvider>
          {element}
          <PortalOutlet />
        </PortalProvider>
      </BloomThemeProvider>,
    ),
  );
}

function settle() {
  for (let i = 0; i < 12; i++) act(() => jest.advanceTimersByTime(100));
}

function press(selector: string) {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`nothing to press at ${selector}`);
  act(() => {
    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    node.dispatchEvent(
      new (window.PointerEvent ?? MouseEvent)('pointerdown', { bubbles: true, cancelable: true }),
    );
  });
}

/** Renders a subject in a state and returns what it found. */
function check(subject: Subject, state: State) {
  if (state === 'closing') {
    mount(subject.render({ state, open: true }));
    settle();
    mount(subject.render({ state, open: false }));
  } else {
    mount(subject.render({ state, open: true }));
    if (state === 'rest' || state === 'disabled' || state === 'pressed') settle();
    if (state === 'pressed')
      press(
        '[data-press-target], button, [role="button"], [role="checkbox"], [role="switch"], [role="tab"], [role="radio"]',
      );
  }
  return { hosts: materialHostCount(), violations: backdropRootViolations() };
}

function Controlled({ open, children }: { open: boolean; children: React.ReactNode }) {
  return <>{open ? children : null}</>;
}

const SUBJECTS: Record<string, Subject> = {
  'button/Button.web.tsx': {
    states: ['rest', 'pressed', 'disabled'],
    render: ({ state }) => (
      <Button appearance="solid" disabled={state === 'disabled'}>
        Save
      </Button>
    ),
  },
  'card/Card.tsx': {
    states: ['rest', 'pressed', 'disabled'],
    render: ({ state }) => (
      <>
        <Card onPress={() => {}} disabled={state === 'disabled'} testID="card">
          <span>Pressable</span>
        </Card>
        <Card disabled={state === 'disabled'}>
          <span>Label</span>
          <Button>Inside</Button>
        </Card>
      </>
    ),
  },
  'surface/Surface.web.tsx': {
    states: ['rest'],
    render: () => (
      <Surface>
        <Button>Inside</Button>
      </Surface>
    ),
  },
  'surface/SurfacePaint.tsx': {
    states: ['rest'],
    render: () => (
      <div style={{ position: 'relative' }}>
        <SurfacePaint fill="#ffffff" radius={12} presence={0.5} />
      </div>
    ),
  },
  'dialog/Dialog.web.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <Dialog open={open} onClose={() => {}} label="Confirm" title="Delete file?">
        <Button>Delete</Button>
      </Dialog>
    ),
  },
  'dialog/Dialog.web.tsx (side)': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <Dialog open={open} onClose={() => {}} label="Details" placement="right">
        <Button>Inside</Button>
      </Dialog>
    ),
  },
  'floating/FloatingPanel.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <Popover open={open} onOpenChange={() => {}}>
        <PopoverTrigger asChild>
          <Button>Open</Button>
        </PopoverTrigger>
        <PopoverContent label="Form">
          <Button>Inside</Button>
        </PopoverContent>
      </Popover>
    ),
  },
  'tooltip/Tooltip.web.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <Tooltip visible={open} onVisibleChange={() => {}}>
        <TooltipTrigger>
          <Button>Hover</Button>
        </TooltipTrigger>
        <TooltipContent label="Hint">
          <span>Hint</span>
        </TooltipContent>
      </Tooltip>
    ),
  },
  'user-hover-card/UserHoverCard.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <Controlled open={open}>
        <UserHoverCard displayName="Ada" username="ada" action={<Button>Follow</Button>} />
      </Controlled>
    ),
  },
  'agent-progress/AgentProgress.tsx': {
    states: ['opening', 'rest'],
    render: () => <AgentProgress steps={['Read', 'Write']} />,
  },
  'admonition/Admonition.tsx': {
    states: ['rest'],
    render: () => <Admonition type="info">Read this carefully.</Admonition>,
  },
  'agent-progress/AgentProgressPlan.tsx': {
    states: ['opening', 'rest'],
    render: () => <AgentProgressPlan steps={['Read the files', 'Write the change']} />,
  },
  'announcement/Announcement.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <Controlled open={open}>
        <Announcement title="Upgrade to Pro" testID="card" />
      </Controlled>
    ),
  },
  'app-shell/ProOfferCard.tsx': {
    states: ['opening', 'rest', 'pressed'],
    render: () => (
      <ProOfferCard title="Pro" description="More of it" ctaLabel="Get Pro" onDismiss={() => {}} />
    ),
  },
  'badge/Badge.tsx': {
    states: ['rest'],
    render: () => <Badge content="new" />,
  },
  'blur/BlurIsland.tsx': {
    states: ['rest'],
    render: () => (
      <BlurIsland>
        <Button>Inside</Button>
      </BlurIsland>
    ),
  },
  'bottom-sheet/BottomSheetBase.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <BottomSheet open={open} accessibilityLabel="Sheet" onDismiss={() => {}}>
        <Button>Inside</Button>
      </BottomSheet>
    ),
  },
  'button/CloseButton.tsx': {
    states: ['rest', 'pressed', 'disabled'],
    render: ({ state }) => (
      <CloseButton accessibilityLabel="Dismiss" disabled={state === 'disabled'} />
    ),
  },
  'chat-indicators/UnreadBadge.tsx': {
    states: ['rest'],
    render: () => <UnreadBadge count={3} />,
  },
  'chat-screen/ChatInfoPanelBase.tsx': {
    states: ['opening', 'rest'],
    render: () => <ChatInfoPanel variant="pane" width={380} name="Ana" />,
  },
  'checkbox/shared.tsx': {
    states: ['rest', 'pressed', 'disabled'],
    flat: ['disabled'],
    render: ({ state }) => (
      <Checkbox label="Remember" disabled={state === 'disabled'} onCheckedChange={() => {}} />
    ),
  },
  'chip/Chip.tsx': {
    states: ['rest', 'pressed', 'disabled'],
    render: ({ state }) => (
      <Chip appearance="solid" onPress={() => {}} disabled={state === 'disabled'}>
        Filter
      </Chip>
    ),
  },
  'composer-panel/ComposerPillBase.tsx': {
    states: ['opening', 'rest'],
    render: () => (
      <ComposerPill
        attachments={[{ id: 'a', name: 'Brief.docx', kind: 'document' }]}
        onRemoveAttachment={() => {}}
      />
    ),
  },
  'content-panel/ContentPanel.web.tsx': {
    states: ['rest'],
    render: () => (
      <ContentPanel framed>
        <Button>Inside</Button>
      </ContentPanel>
    ),
  },
  'file-upload/FileUpload.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => <FileUpload disabled={state === 'disabled'} />,
  },
  'input-group/InputGroup.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => (
      <InputGroup disabled={state === 'disabled'}>
        <span>field</span>
      </InputGroup>
    ),
  },
  'input-otp/InputOtp.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => <InputOtp length={4} disabled={state === 'disabled'} />,
  },
  'mail-compose/MailComposeSurface.tsx': {
    states: ['opening', 'rest'],
    render: () => <MailComposeSurface variant="docked" />,
  },
  'media-controls/PlayButton.tsx': {
    states: ['rest', 'pressed', 'disabled'],
    render: ({ state }) => (
      <PlayButton playing={false} subject="Night Drive" disabled={state === 'disabled'} />
    ),
  },
  'menubar/MenubarBase.tsx': {
    states: ['rest', 'pressed'],
    render: () => (
      <Menubar>
        <MenubarMenu value="file">
          <MenubarTrigger label="File">File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>
    ),
  },
  'notification/Notification.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <Controlled open={open}>
        <Notification title="Saved" description="Your draft is safe." />
      </Controlled>
    ),
  },
  'pagination/Pagination.tsx': {
    states: ['rest', 'pressed'],
    render: () => <Pagination page={2} totalPages={5} onChange={() => {}} />,
  },
  'questionnaire/Questionnaire.tsx': {
    states: ['opening', 'rest'],
    render: () => (
      <Questionnaire
        questions={[
          { id: 'q1', question: 'What brings you here?', options: [{ value: 'a', label: 'A' }] },
        ]}
      />
    ),
  },
  'queue-panel/QueuePanelBase.tsx': {
    states: ['opening', 'rest'],
    render: () => (
      <QueuePanel
        nowPlaying={{ id: 'now', title: 'Harbour Lights', artists: 'Ilse Marn' }}
        queue={[{ id: 'q1', title: 'Slow Tide', artists: 'Ilse Marn' }]}
        context={[]}
        contextName="Night Drive"
      />
    ),
  },
  'radio-indicator/RadioIndicator.tsx': {
    states: ['rest', 'disabled'],
    flat: ['disabled'],
    render: ({ state }) => (
      <>
        <RadioIndicator selected={false} disabled={state === 'disabled'} />
        <RadioIndicator selected disabled={state === 'disabled'} />
      </>
    ),
  },
  'segmented-control/SegmentedControl.tsx': {
    states: ['rest', 'pressed'],
    render: () => (
      <SegmentedControl label="View" type="tabs" value="one" onValueChange={() => {}}>
        <SegmentedControlItem value="one">
          <span>One</span>
        </SegmentedControlItem>
        <SegmentedControlItem value="two">
          <span>Two</span>
        </SegmentedControlItem>
      </SegmentedControl>
    ),
  },
  'select/Select.web.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => (
      <Select value="" onValueChange={() => {}} disabled={state === 'disabled'}>
        <SelectTrigger label="Choose">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
      </Select>
    ),
  },
  'settings-modal/SettingsModalBase.tsx': {
    states: ['opening', 'rest', 'closing'],
    render: ({ open }) => (
      <SettingsModal
        open={open}
        onClose={() => {}}
        groups={[
          {
            label: 'Settings',
            items: [{ key: 'general', page: 'general', label: 'General', icon: RiSettings6Line }],
          },
        ]}
        pages={{ general: { title: 'General', content: <Button>Save</Button> } }}
      />
    ),
  },
  'share-sheet/ShareTargetButton.tsx': {
    states: ['rest', 'pressed'],
    render: () => (
      <ShareSheet
        targets={[{ key: 'link', label: 'Copy link', icon: RiLinkM, onPress: () => {} }]}
      />
    ),
  },
  'sidebar/Sidebar.tsx': {
    states: ['rest'],
    render: () => <Sidebar items={[{ key: 'home', label: 'Home', icon: RiHomeLine, href: '/' }]} />,
  },
  'slider/Slider.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => (
      <Slider
        value={40}
        min={0}
        max={100}
        onValueChange={() => {}}
        accessibilityLabel="Volume"
        disabled={state === 'disabled'}
      />
    ),
  },
  'switch/Switch.tsx': {
    states: ['rest', 'pressed', 'disabled'],
    render: ({ state }) => (
      <Switch
        checked
        onCheckedChange={() => {}}
        accessibilityLabel="Alerts"
        disabled={state === 'disabled'}
      />
    ),
  },
  'tab-bar/TabBarBase.tsx': {
    states: ['rest', 'pressed'],
    render: () => {
      const items = [
        { name: 'home', label: 'Home', icon: <span>h</span> },
        { name: 'search', label: 'Search', icon: <span>s</span> },
      ];
      return (
        <TabBar activeIndex={1}>
          {items.map((item, index) => (
            <TabBarButton key={item.name} item={item} index={index} />
          ))}
        </TabBar>
      );
    },
  },
  'tab-bar/surface.tsx (in the TabBar)': {
    states: ['rest'],
    render: () => (
      <TabBar activeIndex={0}>
        <TabBarButton item={{ name: 'home', label: 'Home', icon: <span>h</span> }} index={0} />
      </TabBar>
    ),
  },
  'tag-field/TagField.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => (
      <TagField value={['a']} onChange={() => {}} disabled={state === 'disabled'} />
    ),
  },
  'text-field/TextField.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => (
      <TextField>
        <TextFieldInput
          label="Name"
          value=""
          onChangeText={() => {}}
          editable={state !== 'disabled'}
          disabled={state === 'disabled'}
        />
      </TextField>
    ),
  },
  'textarea/Textarea.tsx': {
    states: ['rest', 'disabled'],
    render: ({ state }) => <Textarea label="Notes" disabled={state === 'disabled'} />,
  },
  'toast/ToastContent.tsx': {
    states: ['rest'],
    render: () => (
      <ToastContent
        id="t"
        title="Saved"
        variant="success"
        onDismiss={() => {}}
        styles={{}}
        unstyled={false}
        icons={{}}
      />
    ),
  },
};

describe.each(Object.entries(SUBJECTS))('%s', (_name, subject) => {
  it.each(subject.states)('paints its material with no backdrop root when %s', (state) => {
    const { hosts, violations } = check(subject, state);
    if (subject.flat?.includes(state)) expect(hosts).toBe(0);
    else if (state !== 'closing') expect(hosts).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});

describe('the check itself', () => {
  function Host({ outer }: { outer: React.CSSProperties }) {
    return (
      <div style={outer} data-control="outer">
        <div style={{ position: 'relative' }}>
          <SurfacePaint fill="#ffffff" radius={8} />
        </div>
      </div>
    );
  }

  it.each([
    ['opacity', { opacity: 0.5 }],
    ['filter blur(0px)', { filter: 'blur(0px)' }],
    ['clip-path', { clipPath: 'inset(0)' }],
    ['mix-blend-mode', { mixBlendMode: 'multiply' as const }],
  ])('reports a material host under %s', (_label, outer) => {
    mount(<Host outer={outer} />);
    expect(backdropRootViolations().map((v) => v.at)).toContain('div[data-control]');
  });

  it('reports a rule that only matches on hover, and an animation that fades', () => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ctl-fade { from { opacity: 0 } to { opacity: 1 } }
      body:hover [data-control="outer"] { opacity: 0.5 }
      [data-control="anim"] { animation: ctl-fade 1s }
    `;
    document.head.appendChild(style);
    try {
      mount(<Host outer={{}} />);
      const outer = document.querySelector('[data-control="outer"]');
      if (!outer) throw new Error('control host did not render');
      const triggers = backdropRootViolations().map((v) => v.trigger);
      expect(triggers).toContain('rule body:hover [data-control="outer"] { opacity 0.5 }');
      outer.setAttribute('data-control', 'anim');
      expect(backdropRootViolations().map((v) => v.trigger)).toContain('animation ctl-fade');
    } finally {
      style.remove();
    }
  });

  it('passes a host that only moves, and a flat host', () => {
    mount(
      <div style={{ transform: 'scale(0.9)' }}>
        <div style={{ position: 'relative' }}>
          <SurfacePaint fill="#ffffff" radius={8} />
        </div>
      </div>,
    );
    expect(materialHostCount()).toBe(1);
    expect(backdropRootViolations()).toEqual([]);
  });

  it('dims content piece by piece around a nested material host', () => {
    function Dimmed() {
      const [node, setNode] = React.useState<HTMLDivElement | null>(null);
      useSurfacePresenceContent(node, { presence: 0.5 });
      return (
        <div ref={setNode} data-testid="dim-root">
          <span data-testid="label">Label</span>
          <div data-testid="row">
            <span data-testid="row-label">Row</span>
            <Button>Nested</Button>
          </div>
        </div>
      );
    }
    mount(<Dimmed />);
    const opacity = (id: string) =>
      (document.querySelector(`[data-testid="${id}"]`) as HTMLElement).style.opacity;
    expect(opacity('dim-root')).toBe('');
    expect(opacity('row')).toBe('');
    expect(opacity('label')).toBe('0.5');
    expect(opacity('row-label')).toBe('0.5');
    expect(backdropRootViolations()).toEqual([]);
  });
});

describe('every source file that paints the material is checked', () => {
  const SRC = path.join(__dirname, '..');
  /** Painters that do not need a render here, each with the reason. */
  const NOT_RENDERED: Record<string, string> = {
    'surface/web-material.ts': 'the material itself: every host goes through it',
    'surface/use-surface-material.web.ts':
      'the hook FloatingPanel, Tooltip and ContentPanel paint through',
    'button/Button.tsx': 'native Button: native has no backdrop filter',
    'dialog/Dialog.tsx': 'native Dialog: native has no backdrop filter',
    'tooltip/Tooltip.tsx': 'native Tooltip: native has no backdrop filter',
    'surface/Surface.tsx': 'native Surface: native has no backdrop filter',
    'select/Select.tsx': 'native Select: native has no backdrop filter',
    'content-panel/ContentPanel.tsx': 'native ContentPanel: native has no backdrop filter',
    'composer-panel/ComposerPopover.tsx':
      'native ComposerPopover: the web fork is FloatingPanel, rendered above',
  };

  function painters(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === '__tests__' ? [] : painters(file);
      if (!/\.tsx?$/.test(entry.name) || /\.stories\./.test(entry.name)) return [];
      const source = fs.readFileSync(file, 'utf8');
      return /<SurfacePaint\b|useSurfaceMaterial\(|surfaceMaterialCss\(/.test(source)
        ? [path.relative(SRC, file)]
        : [];
    });
  }

  it('renders or classifies each one, and nothing stale', () => {
    const found = painters(SRC).sort();
    expect(found.length).toBeGreaterThan(30);
    const rendered = new Set(Object.keys(SUBJECTS).map((key) => key.split(' ')[0] ?? key));
    const covered = new Set([...rendered, ...Object.keys(NOT_RENDERED)]);
    expect(found.filter((file) => !covered.has(file))).toEqual([]);
    expect([...covered].filter((file) => !found.includes(file))).toEqual([]);
  });

  it('finds the material hosts through the selectors the material registers', () => {
    expect(materialHostSelector()).toContain('.bloom-surface-paint');
    expect(materialHostSelector()).toContain('.bloom-btn--surface');
  });
});
