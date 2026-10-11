import { useMemo, useState } from 'react';
import { useMessages } from '../locale/messages';
import { MULTI_AGENT_CHAT_MESSAGES } from './messages';
const DEMO_DEVICE_ID = '593e2611-b9e3-44e2-1289-ab3f9d21';

import { Button } from '../button';
import { RiExternalLinkLine } from '../icons/remix/RiExternalLinkLine';
import { RiLogoutCircleLine } from '../icons/remix/RiLogoutCircleLine';
import { RiMailLine } from '../icons/remix/RiMailLine';
import { useChatComponents } from './context';

import {
  SettingsDateField,
  SettingsGeneralPage,
  SettingsProfilePage,
  SettingsStoragePage,
  SettingsTextField,
  SettingsToolsPage,
  SettingsValueField,
} from '../settings-modal';
import type {
  SettingsMcpServer,
  SettingsModalPage,
  SettingsStoredFile,
  SettingsToolsScope,
} from '../settings-modal/types';
import { Switch } from '../switch';

const SERVERS: Record<string, SettingsMcpServer> = {
  astro: { id: 'astro', name: 'astro', tone: 'neutral', status: 'error' },
  figma: {
    id: 'figma',
    name: 'Figma',
    tone: 'secondary',
    status: 'connected',
    summary: '26 tools, 1 prompts, 104 resources enabled',
    tools: [
      'get_design_context',
      'get_metadata',
      'get_screenshot',
      'get_variable_defs',
      'create_new_file',
    ],
  },
  paper: { id: 'paper', name: 'paper', tone: 'primary', status: 'error' },
  posthog: {
    id: 'posthog',
    name: 'posthog',
    tone: 'warning',
    status: 'connected',
    summary: '521 tools, 173 resources enabled',
    tools: [
      'query_insights',
      'list_dashboards',
      'capture_event',
      'feature_flags',
      'session_recordings',
    ],
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
const NAMES = [
  'Invoice',
  'Contract',
  'Payroll Sheet',
  'Quarterly report',
  'Pitch deck',
  'Budget plan',
  'Onboarding video',
  'Team photo',
  'Meeting notes',
  'Roadmap',
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];

/** A 1,262-file inventory: five pinned rows, the rest generated. */
const FILES: SettingsStoredFile[] = (() => {
  const pinned = [
    { name: 'Invoice 1', kind: 'document', size: 4 * MB, sizeLabel: '4 MB' },
    {
      name: 'Payroll Sheet',
      kind: 'spreadsheet',
      size: 539 * 1024,
      sizeLabel: '539 KB',
    },
    { name: 'Welcome video', kind: 'video', size: 36 * MB, sizeLabel: '36 MB' },
    {
      name: 'Payroll Sheet',
      kind: 'spreadsheet',
      size: 539 * 1024,
      sizeLabel: '539 KB',
    },
    { name: 'Invoice 1', kind: 'document', size: 4 * MB, sizeLabel: '4 MB' },
  ];
  const rng = makeRng(26);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)] as T;
  const total = 1262;
  return Array.from({ length: total }, (_, i): SettingsStoredFile => {
    const p = pinned[i];
    if (p)
      return {
        id: `file-${i}`,
        uploadedOn: 'May 11, 2026',
        uploadedAt: total - i,
        ...p,
      };
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

function CompactSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
}) {
  const {
    Select: {
      Select,
      SelectContent,
      SelectIcon,
      SelectItem,
      SelectItemIndicator,
      SelectItemText,
      SelectTrigger,
      SelectValue,
    },
  } = useChatComponents();
  return (
    // A compact row trigger: `h-8 gap-1 px-2 py-1.5` on the md select.
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger label={label} className="h-8 gap-1 px-2 py-1.5">
        <SelectValue>
          {(v) => {
            const key =
              typeof v === 'object' && v !== null && 'value' in v
                ? (v as { value: string }).value
                : v;
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
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const [toggles, setToggles] = useState({
    critical: true,
    system: false,
    sound: false,
    dispatch: false,
  });
  const [provider, setProvider] = useState('github');
  const [destination, setDestination] = useState('inside');
  const toggle = (key: keyof typeof toggles, label: string) => (
    <Switch
      checked={toggles[key]}
      onCheckedChange={(v) => setToggles((t) => ({ ...t, [key]: v }))}
      accessibilityLabel={label}
    />
  );
  return (
    <SettingsGeneralPage
      plan={{
        title: messages.ultra149Mo,
        description: messages.youAreOn7xMoreUsageThan2,
        action: (
          <Button appearance="subtle" tone="neutral" size="sm">
            {messages.upgradeToMax}
          </Button>
        ),
      }}
      sections={[
        {
          key: 'limits',
          rows: [
            {
              key: 'limits',
              label: messages.limits,
              description: messages.youAreOn7xMoreUsageThan,
              control: (
                <Button appearance="subtle" tone="neutral" size="sm">
                  {messages.manageLimits}
                </Button>
              ),
            },
          ],
        },
        {
          key: 'pull-requests',
          label: messages.pullRequests,
          rows: [
            {
              key: 'provider',
              label: messages.reviewProvider,
              description: messages.selectGithubOrOtherProvidersForReviews,
              control: (
                <CompactSelect
                  label={messages.reviewProvider}
                  value={provider}
                  onChange={setProvider}
                  items={[
                    { value: 'github', label: messages.github },
                    { value: 'gitlab', label: messages.gitlab },
                    { value: 'bitbucket', label: messages.bitbucket },
                  ]}
                />
              ),
            },
            {
              key: 'destination',
              label: messages.prDestination,
              description: messages.openPullRequestLinksInsideYourApp,
              control: (
                <CompactSelect
                  label={messages.prDestination}
                  value={destination}
                  onChange={setDestination}
                  items={[
                    { value: 'inside', label: messages.insideTheApp },
                    { value: 'browser', label: messages.inTheBrowser },
                  ]}
                />
              ),
            },
          ],
        },
        {
          key: 'notifications',
          label: messages.notifications,
          rows: [
            {
              key: 'critical',
              label: messages.criticalRequests,
              description: messages.getNotifiedWhenTheModeNeedsTo,
              control: toggle('critical', messages.criticalRequests),
            },
            {
              key: 'system',
              label: messages.systemNotifications,
              description: messages.showFundamentalNotificationsWhenAnAgentCompletes,
              control: toggle('system', messages.systemNotifications),
            },
            {
              key: 'sound',
              label: messages.completionSound,
              description: messages.soundEffectATaskIsCompleted,
              control: toggle('sound', messages.completionSound),
            },
            {
              key: 'dispatch',
              label: messages.dispatchAlerts,
              description: messages.pushNotificationOnYourPhoneWhenThe,
              control: toggle('dispatch', messages.dispatchAlerts),
            },
          ],
        },
      ]}
    />
  );
}

function ProfileDemo() {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  const [profile, setProfile] = useState({
    email: 'hi@example.com',
    first: 'Maya',
    last: 'Collins',
  });
  const [birth, setBirth] = useState(new Date(1997, 6, 28));
  const [publicProfile, setPublicProfile] = useState(true);
  return (
    <SettingsProfilePage
      sections={[
        {
          key: 'identity',
          rows: [
            {
              key: 'email',
              label: messages.email,
              control: (
                <SettingsTextField
                  label={messages.email}
                  icon={RiMailLine}
                  keyboardType="email-address"
                  value={profile.email}
                  onCommit={(email) => setProfile((p) => ({ ...p, email }))}
                />
              ),
            },
            {
              key: 'first',
              label: messages.firstName,
              control: (
                <SettingsTextField
                  label={messages.firstName}
                  value={profile.first}
                  onCommit={(first) => setProfile((p) => ({ ...p, first }))}
                />
              ),
            },
            {
              key: 'last',
              label: messages.lastName,
              control: (
                <SettingsTextField
                  label={messages.lastName}
                  value={profile.last}
                  onCommit={(last) => setProfile((p) => ({ ...p, last }))}
                />
              ),
            },
            {
              key: 'birth',
              label: messages.dateOfBirth,
              control: (
                <SettingsDateField label={messages.dateOfBirth} value={birth} onChange={setBirth} />
              ),
            },
          ],
        },
        {
          key: 'account',
          rows: [
            {
              key: 'account',
              label: messages.connectedAccount,
              control: (
                <Button
                  appearance="subtle"
                  tone="neutral"
                  size="sm"
                  leadingIcon={RiExternalLinkLine}
                >
                  {messages.manage}
                </Button>
              ),
            },
            {
              key: 'public',
              label: messages.publicProfile,
              description: messages.whenEnabledYourProfilePageWillBe,
              control: (
                <Switch
                  checked={publicProfile}
                  onCheckedChange={setPublicProfile}
                  accessibilityLabel={messages.publicProfile}
                />
              ),
            },
            {
              key: 'device',
              label: messages.deviceID,
              control: <SettingsValueField muted>{DEMO_DEVICE_ID}</SettingsValueField>,
            },
            {
              key: 'logout',
              label: messages.logOutFromAllDevices,
              control: (
                <Button
                  appearance="subtle"
                  tone="neutral"
                  size="sm"
                  leadingIcon={RiLogoutCircleLine}
                >
                  {messages.logout}
                </Button>
              ),
            },
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
              uploadedOn: new Date(now).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
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

export function useWorkspaceSettingsPages(): Record<string, SettingsModalPage> {
  const { messages } = useMessages(MULTI_AGENT_CHAT_MESSAGES);
  return useMemo(
    () => ({
      general: { title: messages.general, content: <GeneralDemo /> },
      profile: { title: messages.profile, content: <ProfileDemo /> },
      tools: { title: messages.tools, content: <ToolsDemo /> },
      storage: {
        title: messages.storage,
        content: <StorageDemo />,
        compactTitle: true,
      },
    }),
    [messages],
  );
}
