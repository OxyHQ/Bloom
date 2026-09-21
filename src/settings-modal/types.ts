import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { DialogControlProps } from '../dialog/types';
import type { FileUploadProps } from '../file-upload/types';
import type { Props as SVGIconProps } from '../icons/shared';

/** Any Bloom icon — the Remix set (`../icons/remix`) is what's drawn here. */
export type SettingsIcon = ComponentType<SVGIconProps>;

// ---------------------------------------------------------------------------
//  Modal
// ---------------------------------------------------------------------------

/** One rail row. Rows with a `page` navigate; rows without one call `onPress` (or are static). */
export interface SettingsNavItem {
  key: string;
  label: string;
  icon: SettingsIcon;
  /** Key into `SettingsModalProps.pages`. */
  page?: string;
  /** For rows that are not pages (e.g. open a billing portal). */
  onPress?: () => void;
  disabled?: boolean;
}

/** A labelled group of rail rows ("Settings", "Desktop app", "Customize"). */
export interface SettingsNavGroup {
  key?: string;
  label: string;
  items: SettingsNavItem[];
}

/** One page of the content pane. */
export interface SettingsModalPage {
  /** Heading of the fixed title row. */
  title: string;
  content: ReactNode;
  /**
   * Used on the Storage page: a 6px title gap instead of 12px, because the page
   * already carries 10px of headroom for the dropzone's progress badge.
   */
  compactTitle?: boolean;
}

export interface SettingsModalLabels {
  /** Dialog name. Default `Settings`. */
  dialog?: string;
  /** Rail landmark name. Default `Settings sections`. */
  nav?: string;
  /** Close button and backdrop. Default `Close settings`. */
  close?: string;
  /** The saved toast. Default `Saved`. */
  saved?: string;
  /** Compact layout: the back button from a page to the section list. Default `Back`. */
  back?: string;
}

export interface SettingsModalProps {
  /** Imperative control from `useDialogControl()` — the preferred driver. */
  control?: DialogControlProps;
  /** Controlled visibility. When set it wins over `control`. */
  open?: boolean;
  /**
   * Controlled mode: a close was requested (backdrop, close button, Escape).
   * Imperative mode: the modal finished closing.
   */
  onClose?: () => void;
  groups: SettingsNavGroup[];
  pages: Record<string, SettingsModalPage>;
  /** Controlled current page. */
  page?: string;
  /** Page selected every time the modal opens. Defaults to the first navigable row. */
  defaultPage?: string;
  onPageChange?: (page: string) => void;
  /** Compact layout: start at the section list (default) or open the selected page directly. Resets on each open. */
  initialView?: 'navigation' | 'page';
  labels?: SettingsModalLabels;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Rows
// ---------------------------------------------------------------------------

export interface SettingsCardProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SettingsRowProps {
  label: string;
  description?: string;
  /** The control on the right. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SettingsSectionLabelProps {
  children?: ReactNode;
  /** Horizontal inset: 12 (General), 8 (Tools). Default 12. */
  inset?: number;
  style?: StyleProp<ViewStyle>;
}

export interface SettingsSectionProps {
  label?: string;
  /** Muted line under the label (Tools). */
  description?: string;
  /** Trailing header action, bottom-aligned with the label block (Team servers → Manage). */
  action?: ReactNode;
  /** Label inset. Default 12; the Tools page uses 8. */
  inset?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SettingsValueFieldProps {
  icon?: SettingsIcon;
  children?: ReactNode;
  /** Secondary text colour (e.g. a truncated device id). */
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SettingsTextFieldProps {
  /** Accessible name (the row's label). */
  label: string;
  /** The committed value. The field edits a draft and commits on submit/blur. */
  value: string;
  /** Fires with the new value when a changed draft is committed. */
  onCommit?: (value: string) => void;
  /** Show the modal's saved toast on commit. Default true. */
  showSavedToast?: boolean;
  icon?: SettingsIcon;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoComplete?: 'email' | 'name' | 'given-name' | 'family-name' | 'off';
  disabled?: boolean;
  testID?: string;
}

export interface SettingsDateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  /** Default `28 July 1997` style (`day month year`). */
  formatDate?: (date: Date) => string;
  minDate?: Date;
  maxDate?: Date;
  showSavedToast?: boolean;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  General / Profile
// ---------------------------------------------------------------------------

export interface SettingsPlanCardProps {
  /** Chip over the title. Default `Current plan`. */
  badge?: string;
  title: string;
  description?: string;
  /** Usually a secondary small `Button` ("Upgrade to Max"). */
  action?: ReactNode;
  /** Image URL burned by the artwork. Omitted → Bloom's generated blobs. */
  artworkSource?: string;
  /** Replace the artwork entirely (the radial fade still covers it). */
  artwork?: ReactNode;
  /** Animate the artwork (web WebGL). Default true; always off under reduced motion. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SettingsPlanArtProps {
  source?: string;
  animated?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export interface SettingsRowData {
  key: string;
  label: string;
  description?: string;
  control?: ReactNode;
}

export interface SettingsPageSection {
  key: string;
  label?: string;
  description?: string;
  action?: ReactNode;
  rows: SettingsRowData[];
}

export interface SettingsGeneralPageProps {
  plan?: SettingsPlanCardProps;
  sections: SettingsPageSection[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SettingsProfilePageProps {
  sections: SettingsPageSection[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Tools
// ---------------------------------------------------------------------------

/** Letter-tile swatch: neutral, pink, blue, amber, near-black. */
export type SettingsServerTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'inverse';

export interface SettingsMcpServer {
  id: string;
  name: string;
  /** Tile letter. Default: first letter of `name`, upper-cased. */
  initial?: string;
  tone?: SettingsServerTone;
  status: 'connected' | 'error';
  /** e.g. "26 tools, 1 prompts, 104 resources enabled". */
  summary?: string;
  /** Names revealed by the expander chevron. */
  tools?: string[];
}

export interface SettingsToolsScope {
  id: string;
  label: string;
  servers: SettingsMcpServer[];
}

export interface SettingsMenuAction {
  id: string;
  label: string;
  icon?: SettingsIcon;
}

export interface SettingsServerListProps {
  servers: SettingsMcpServer[];
  /** Adds a "New MCP Server" row after the servers. */
  onAddServer?: () => void;
  addServerLabel?: string;
  addServerDescription?: string;
  actions?: SettingsMenuAction[];
  onServerAction?: (serverId: string, actionId: string) => void;
  onLogout?: (serverId: string) => void;
  onShowOutput?: (serverId: string) => void;
  testID?: string;
}

export interface SettingsToolsPageProps {
  scopes: SettingsToolsScope[];
  scope?: string;
  defaultScope?: string;
  onScopeChange?: (scope: string) => void;
  waitForAuthentication: boolean;
  onWaitForAuthenticationChange: (value: boolean) => void;
  /** Team servers. Empty → the empty state. */
  teamServers?: SettingsMcpServer[];
  onManageTeam?: () => void;
  onConfigureTeam?: () => void;
  pluginServers?: SettingsMcpServer[];
  onAddServer?: () => void;
  serverActions?: SettingsMenuAction[];
  onServerAction?: (serverId: string, actionId: string) => void;
  onLogout?: (serverId: string) => void;
  onShowOutput?: (serverId: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ---------------------------------------------------------------------------
//  Storage
// ---------------------------------------------------------------------------

export interface SettingsStoredFile {
  id: string;
  name: string;
  /** Filter key — `document`, `spreadsheet`, `video` by default. */
  kind: string;
  /** Display label, e.g. "May 11, 2026". */
  uploadedOn: string;
  /** Sort key for "Uploaded on" (bigger = newer), e.g. epoch ms. */
  uploadedAt: number;
  /** Bytes, for sorting and the default size label. */
  size: number;
  /** Overrides the formatted size. */
  sizeLabel?: string;
}

export interface SettingsFileKind {
  value: string;
  label: string;
}

export interface SettingsStoragePageProps {
  files: SettingsStoredFile[];
  /**
   * The dropzone's props — Bloom's `FileUpload`. Omitted, it runs a
   * self-simulating demo; pass `file`/`progress`/`onFileSelected` for a real
   * upload, and add the finished file to `files` from `onUploadComplete`.
   */
  upload?: Omit<FileUploadProps, 'style' | 'testID'>;
  kinds?: SettingsFileKind[];
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Rows per page. Default 6. */
  pageSize?: number;
  /** Called after the row's exit animation. */
  onDeleteFile?: (id: string) => void;
  fileActions?: SettingsMenuAction[];
  onFileAction?: (fileId: string, actionId: string) => void;
  renderFileIcon?: (file: Pick<SettingsStoredFile, 'name' | 'kind'>) => ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
