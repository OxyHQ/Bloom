import React, { useEffect, useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { SettingsModalContext, settingsLayoutFor } from './context';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';
import { useDialogControl } from '../dialog';
import {
  RiBankCardLine,
  RiBookOpenLine,
  RiCodeBlock,
  RiDatabase2Line,
  RiExternalLinkLine,
  RiGitMergeLine,
  RiLogoutCircleLine,
  RiMailLine,
  RiOrganizationChart,
  RiPaletteLine,
  RiPlugLine,
  RiSchoolLine,
  RiSettings6Line,
  RiSettingsLine,
  RiToolsFill,
} from '../icons/remix';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import { Switch } from '../switch';
import {
  SettingsCard,
  SettingsDateField,
  SettingsGeneralPage,
  SettingsModal,
  SettingsProfilePage,
  SettingsRow,
  SettingsStoragePage,
  SettingsTextField,
  SettingsToolsPage,
  SettingsValueField,
} from './index';
import type {
  SettingsMcpServer,
  SettingsModalPage,
  SettingsNavGroup,
  SettingsStoredFile,
  SettingsToolsScope,
} from './types';

const meta: Meta<typeof SettingsModal> = {
  title: 'Blocks/Settings Modal',
  component: SettingsModal,
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof SettingsModal>;

// ---------------------------------------------------------------------------
//  Demo data
// ---------------------------------------------------------------------------

const GROUPS: SettingsNavGroup[] = [
  {
    label: 'Settings',
    items: [
      { key: 'general', label: 'General', icon: RiSettings6Line, page: 'general' },
      { key: 'profile', label: 'Profile', icon: RiSchoolLine, page: 'profile' },
      { key: 'appearance', label: 'Appearance', icon: RiPaletteLine },
      { key: 'billing', label: 'Billing', icon: RiBankCardLine },
      { key: 'rules', label: 'Rules and Workflows', icon: RiOrganizationChart },
      { key: 'tools', label: 'Tools', icon: RiToolsFill, page: 'tools' },
      { key: 'storage', label: 'Storage', icon: RiDatabase2Line, page: 'storage' },
    ],
  },
  {
    label: 'Desktop app',
    items: [
      { key: 'desktop-general', label: 'General', icon: RiSettingsLine },
      { key: 'plugins', label: 'Plugins', icon: RiPlugLine },
      { key: 'developer', label: 'Developer', icon: RiCodeBlock },
    ],
  },
  {
    label: 'Customize',
    items: [
      { key: 'skills', label: 'Skills', icon: RiBookOpenLine },
      { key: 'git', label: 'Git', icon: RiGitMergeLine },
    ],
  },
];

const SERVERS: Record<string, SettingsMcpServer> = {
  astro: { id: 'astro', name: 'astro', tone: 'neutral', status: 'error' },
  figma: {
    id: 'figma',
    name: 'Figma',
    tone: 'secondary',
    status: 'connected',
    summary: '26 tools, 1 prompts, 104 resources enabled',
    tools: ['get_design_context', 'get_metadata', 'get_screenshot', 'get_variable_defs', 'create_new_file'],
  },
  paper: { id: 'paper', name: 'paper', tone: 'primary', status: 'error' },
  posthog: {
    id: 'posthog',
    name: 'posthog',
    tone: 'warning',
    status: 'connected',
    summary: '521 tools, 173 resources enabled',
    tools: ['query_insights', 'list_dashboards', 'capture_event', 'feature_flags', 'session_recordings'],
  },
  vercel: {
    id: 'vercel',
    name: 'vercel',
    tone: 'inverse',
    status: 'connected',
    summary: '30 tools, 13 prompts enabled',
    tools: ['list_deployments', 'get_build_logs', 'promote_deployment', 'env_variables'],
  },
};

const SCOPES: SettingsToolsScope[] = [
  { id: 'home', label: 'Home', servers: [SERVERS.astro!, SERVERS.figma!] },
  { id: 'bloom', label: 'bloom', servers: [SERVERS.figma!, SERVERS.vercel!] },
  { id: 'iospoke', label: 'iospoke', servers: [SERVERS.astro!] },
  { id: 'mideo', label: 'mideo', servers: [SERVERS.posthog!] },
  { id: 'bereal', label: 'BeReal Task', servers: [SERVERS.figma!] },
  { id: 'poke', label: 'poke-1', servers: [] },
  { id: 'cloud', label: 'Cloud', servers: [SERVERS.vercel!, SERVERS.posthog!] },
];

/** mulberry32, so the inventory is stable across renders. */
function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MB = 1024 * 1024;
const NAMES = ['Invoice', 'Contract', 'Payroll Sheet', 'Quarterly report', 'Pitch deck', 'Budget plan', 'Onboarding video', 'Team photo', 'Meeting notes', 'Roadmap'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];

/** A 1,262-file inventory: five pinned rows, the rest generated. */
const FILES: SettingsStoredFile[] = (() => {
  const pinned = [
    { name: 'Invoice 1', kind: 'document', size: 4 * MB, sizeLabel: '4 MB' },
    { name: 'Payroll Sheet', kind: 'spreadsheet', size: 539 * 1024, sizeLabel: '539 KB' },
    { name: 'Welcome video', kind: 'video', size: 36 * MB, sizeLabel: '36 MB' },
    { name: 'Payroll Sheet', kind: 'spreadsheet', size: 539 * 1024, sizeLabel: '539 KB' },
    { name: 'Invoice 1', kind: 'document', size: 4 * MB, sizeLabel: '4 MB' },
  ];
  const rng = makeRng(26);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)] as T;
  const total = 1262;
  return Array.from({ length: total }, (_, i): SettingsStoredFile => {
    const p = pinned[i];
    if (p) return { id: `file-${i}`, uploadedOn: 'May 11, 2026', uploadedAt: total - i, ...p };
    const kind = pick(['document', 'document', 'spreadsheet', 'video']);
    const size = Math.floor(kind === 'video' ? (4 + rng() * 60) * MB : 40 * 1024 + rng() * 7 * MB);
    return {
      id: `file-${i}`,
      name: `${pick(NAMES)} ${1 + Math.floor(rng() * 40)}`,
      kind,
      uploadedOn: `${pick(MONTHS)} ${1 + Math.floor(rng() * 28)}, 2026`,
      uploadedAt: total - i,
      size,
    };
  });
})();

// ---------------------------------------------------------------------------
//  Pages, wired with local state
// ---------------------------------------------------------------------------

function CompactSelect({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: { value: string; label: string }[] }) {
  return (
    // A compact row trigger: `h-8 gap-1 px-2 py-1.5` on the md select.
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger label={label} className="h-8 gap-1 px-2 py-1.5">
        <SelectValue>
          {(v) => {
            const key = typeof v === 'object' && v !== null && 'value' in v ? (v as { value: string }).value : v;
            return items.find((i) => i.value === key)?.label ?? String(key);
          }}
        </SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label={label}
        items={items}
        valueExtractor={(i) => i.value}
        renderItem={(i) => (
          <SelectItem value={i.value} label={i.label}>
            <SelectItemIndicator />
            <SelectItemText>{i.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

function GeneralDemo() {
  const [toggles, setToggles] = useState({ critical: true, system: false, sound: false, dispatch: false });
  const [provider, setProvider] = useState('github');
  const [destination, setDestination] = useState('inside');
  const toggle = (key: keyof typeof toggles, label: string) => (
    <Switch checked={toggles[key]} onCheckedChange={(v) => setToggles((t) => ({ ...t, [key]: v }))} accessibilityLabel={label} />
  );
  return (
    <SettingsGeneralPage
      plan={{
        title: 'Ultra $149/mo',
        description: 'You are on 7x more usage than Regular.',
        action: (
          <Button size="sm" appearance="outline" tone="neutral">
            Upgrade to Max
          </Button>
        ),
      }}
      sections={[
        {
          key: 'limits',
          rows: [
            {
              key: 'limits',
              label: 'Limits',
              description: 'You are on 7x more usage than Premium',
              control: (
                <Button size="sm" appearance="outline" tone="neutral">
                  Manage limits
                </Button>
              ),
            },
          ],
        },
        {
          key: 'pull-requests',
          label: 'Pull Requests',
          rows: [
            {
              key: 'provider',
              label: 'Review provider',
              description: 'Select Github or other providers for reviews',
              control: (
                <CompactSelect
                  label="Review provider"
                  value={provider}
                  onChange={setProvider}
                  items={[
                    { value: 'github', label: 'GitHub' },
                    { value: 'gitlab', label: 'GitLab' },
                    { value: 'bitbucket', label: 'Bitbucket' },
                  ]}
                />
              ),
            },
            {
              key: 'destination',
              label: 'PR destination',
              description: 'Open pull request links inside your app',
              control: (
                <CompactSelect
                  label="PR destination"
                  value={destination}
                  onChange={setDestination}
                  items={[
                    { value: 'inside', label: 'Inside the app' },
                    { value: 'browser', label: 'In the browser' },
                  ]}
                />
              ),
            },
          ],
        },
        {
          key: 'notifications',
          label: 'Notifications',
          rows: [
            { key: 'critical', label: 'Critical requests', description: 'Get notified when the mode needs to make a critical decision', control: toggle('critical', 'Critical requests') },
            { key: 'system', label: 'System notifications', description: 'Show fundamental notifications when an agent completes a task', control: toggle('system', 'System notifications') },
            { key: 'sound', label: 'Completion sound', description: 'Sound effect a task is completed', control: toggle('sound', 'Completion sound') },
            { key: 'dispatch', label: 'Dispatch alerts', description: 'Push notification on your phone when the app messages you', control: toggle('dispatch', 'Dispatch alerts') },
          ],
        },
      ]}
    />
  );
}

function ProfileDemo() {
  const [profile, setProfile] = useState({ email: 'hi@example.com', first: 'Maya', last: 'Collins' });
  const [birth, setBirth] = useState(new Date(1997, 6, 28));
  const [publicProfile, setPublicProfile] = useState(true);
  return (
    <SettingsProfilePage
      sections={[
        {
          key: 'identity',
          rows: [
            { key: 'email', label: 'Email', control: <SettingsTextField label="Email" icon={RiMailLine} keyboardType="email-address" value={profile.email} onCommit={(email) => setProfile((p) => ({ ...p, email }))} /> },
            { key: 'first', label: 'First name', control: <SettingsTextField label="First name" value={profile.first} onCommit={(first) => setProfile((p) => ({ ...p, first }))} /> },
            { key: 'last', label: 'Last name', control: <SettingsTextField label="Last name" value={profile.last} onCommit={(last) => setProfile((p) => ({ ...p, last }))} /> },
            { key: 'birth', label: 'Date of birth', control: <SettingsDateField label="Date of birth" value={birth} onChange={setBirth} /> },
          ],
        },
        {
          key: 'account',
          rows: [
            { key: 'account', label: 'Connected account', control: <Button size="sm" leadingIcon={RiExternalLinkLine} appearance="outline" tone="neutral">Manage</Button> },
            { key: 'public', label: 'Public profile', description: 'When enabled your profile page will be visible to anyone', control: <Switch checked={publicProfile} onCheckedChange={setPublicProfile} accessibilityLabel="Public profile" /> },
            { key: 'device', label: 'Device ID', control: <SettingsValueField muted>593e2611-b9e3-44e2-1289-ab3f9d21</SettingsValueField> },
            { key: 'logout', label: 'Log out from all devices', control: <Button size="sm" leadingIcon={RiLogoutCircleLine} appearance="outline" tone="neutral">Logout</Button> },
          ],
        },
      ]}
    />
  );
}

function ToolsDemo() {
  const [wait, setWait] = useState(true);
  return (
    <SettingsToolsPage
      scopes={SCOPES}
      waitForAuthentication={wait}
      onWaitForAuthenticationChange={setWait}
      pluginServers={[SERVERS.paper!, SERVERS.posthog!, SERVERS.vercel!]}
      onAddServer={() => {}}
    />
  );
}

function StorageDemo() {
  const [files, setFiles] = useState(FILES);
  return (
    <SettingsStoragePage
      files={files}
      defaultSelectedIds={['file-1', 'file-3']}
      // FileUpload's own demo simulation; a real app passes file/progress.
      upload={{
        onUploadComplete: (file) => {
          const now = Date.now();
          const ext = file.name.split('.').pop()?.toLowerCase();
          setFiles((prev) => [
            {
              id: `upload-${now}`,
              name: file.name.replace(/\.[^.]+$/, ''),
              kind: ext === 'xlsx' ? 'spreadsheet' : 'document',
              uploadedOn: new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              uploadedAt: 10_000 + now / 1000,
              size: file.size,
            },
            ...prev,
          ]);
        },
      }}
      onDeleteFile={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
    />
  );
}

function usePages(): Record<string, SettingsModalPage> {
  return useMemo(
    () => ({
      general: { title: 'General', content: <GeneralDemo /> },
      profile: { title: 'Profile', content: <ProfileDemo /> },
      tools: { title: 'Tools', content: <ToolsDemo /> },
      storage: { title: 'Storage', content: <StorageDemo />, compactTitle: true },
    }),
    [],
  );
}

// ---------------------------------------------------------------------------
//  Stories
// ---------------------------------------------------------------------------

/** The realistic flow: a button opens the modal through `useDialogControl()`. */
export const Playground: Story = {
  args: { defaultPage: 'general' },
  parameters: { controls: { disable: false, include: ['defaultPage'] } },
  argTypes: { defaultPage: { control: 'select', options: ['general', 'profile', 'tools', 'storage'] } },
  render: function PlaygroundStory(args) {
    const control = useDialogControl();
    const pages = usePages();
    return (
      <View style={{ padding: 24 }}>
        <Button onPress={() => control.open()}>Open settings</Button>
        <SettingsModal {...args} control={control} groups={GROUPS} pages={pages} testID="settings" />
      </View>
    );
  },
};

function OpenOn({ page }: { page: string }) {
  const pages = usePages();
  const control = useDialogControl();
  useEffect(() => { control.open(); }, [control.open]);
  return (
    <View style={{ padding: 24 }}>
      <Button onPress={() => control.open()}>Open settings</Button>
      <SettingsModal control={control} groups={GROUPS} pages={pages} defaultPage={page} testID="settings" />
    </View>
  );
}

export const General: Story = {
  parameters: { controls: { disable: true } }, render: () => <OpenOn page="general" /> };
export const Profile: Story = {
  parameters: { controls: { disable: true } }, render: () => <OpenOn page="profile" /> };
export const Tools: Story = {
  parameters: { controls: { disable: true } }, render: () => <OpenOn page="tools" /> };
export const Storage: Story = {
  parameters: { controls: { disable: true } }, render: () => <OpenOn page="storage" /> };

/** The pages outside the shell, at the modal's 533px content width. */
export const Pages: Story = {
  parameters: { controls: { disable: true } },
  render: function PagesStory() {
    const { width } = useWindowDimensions();
    // Isolated pages need the same responsive layout context as the modal shell.
    return <SettingsModalContext.Provider value={{ layout: settingsLayoutFor(width), showSaved: () => {}, close: () => {} }}>
      <View style={{ padding: 16, maxWidth: '100%', gap: 40 }}>
        {[<GeneralDemo key="g" />, <ProfileDemo key="p" />, <ToolsDemo key="t" />, <StorageDemo key="s" />].map((page, i) => (
          <View key={i} style={{ width: 533, maxWidth: '100%' }} testID={`page-${i}`}>
            {page}
          </View>
        ))}
      </View>
    </SettingsModalContext.Provider>;
  },
};

/** Row chrome on its own: the hairline stops 12px from the left and skips the last row. */
export const Rows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <View style={{ padding: 24, width: 581, maxWidth: '100%' }}>
      <SettingsCard testID="card">
        <SettingsRow label="Email">
          <SettingsValueField icon={RiMailLine}>hi@example.com</SettingsValueField>
        </SettingsRow>
        <SettingsRow label="Device ID" description="Truncated, muted">
          <SettingsValueField muted>593e2611-b9e3-44e2-1289-ab3f9d21</SettingsValueField>
        </SettingsRow>
        <SettingsRow label="Last row" description="No hairline under it" />
      </SettingsCard>
    </View>
  ),
};
