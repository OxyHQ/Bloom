import { defineMessages, type MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/**
 * Every fixed string the settings-modal family draws or announces, in each
 * Bloom language. The modal's `labels`, `SettingsPlanCard`'s `badge`,
 * `SettingsServerList`'s `addServer*`, and the `kinds` / `fileActions` /
 * `serverActions` props still win over any entry here. Dates come from `Intl`.
 */
export interface SettingsModalMessages {
  /** The dialog's name and the compact layout's title. */
  dialog: string;
  /** The rail landmark's name. */
  nav: string;
  /** The close button and backdrop. */
  close: string;
  /** The saved toast. */
  saved: string;
  /** `SettingsPlanCard`'s chip. */
  currentPlan: string;
  /** A column header, and the name of a server's "…" menu (with `labelFor`). */
  actions: string;
  storage: {
    storedIn: string;
    /** "12 files" — `shown` is the count as the page formats it. */
    fileCount: (count: number, shown: string) => string;
    filterByType: string;
    /** The type filter's "all" entry. */
    fileType: string;
    orderBy: string;
    modified: string;
    oldestFirst: string;
    searchFiles: string;
    selectAllOnPage: string;
    fileName: string;
    uploadedOn: string;
    fileSize: string;
    /** Each sortable header's name. */
    sortBy: { name: string; uploadedAt: string; size: string };
    selectFile: (name: string) => string;
    deleteFile: string;
    deleteNamed: (name: string) => string;
    noMatches: string;
    documents: string;
    spreadsheets: string;
    videos: string;
    downloadFile: string;
    rename: string;
    copyLink: string;
  };
  tools: {
    /** The default server menu. */
    showOutput: string;
    refreshTools: string;
    removeServer: string;
    logout: string;
    logOutOf: (server: string) => string;
    showTools: (server: string) => string;
    hideTools: (server: string) => string;
    error: string;
    /** The inline link after "Error –". */
    showOutputLink: string;
    showOutputOf: (server: string) => string;
    newServer: string;
    newServerDescription: string;
    projectScope: string;
    authentication: string;
    waitForAuth: string;
    waitForAuthDescription: string;
    /** The switch's own name. */
    waitForAuthSwitch: string;
    scopeServers: (scope: string) => string;
    scopeServersDescription: (scope: string) => string;
    teamServers: string;
    teamServersDescription: string;
    manage: string;
    noTeamServers: string;
    noTeamServersBody: string;
    configureTeam: string;
    pluginServers: string;
  };
}

export const SETTINGS_MODAL_MESSAGES: MessageCatalog<SettingsModalMessages> = defineMessages<SettingsModalMessages>('SETTINGS_MODAL_MESSAGES', {
  dialog: 'Settings',
  nav: 'Settings sections',
  close: 'Close settings',
  saved: 'Saved',
  currentPlan: 'Current plan',
  actions: 'Actions',
  storage: {
    storedIn: 'Stored in',
    fileCount: (n, shown) => plural('en', n, { one: `${shown} file`, other: `${shown} files` }),
    filterByType: 'Filter by file type',
    fileType: 'File type',
    orderBy: 'Order by',
    modified: 'Modified',
    oldestFirst: 'Oldest first',
    searchFiles: 'Search files',
    selectAllOnPage: 'Select all files on this page',
    fileName: 'File name',
    uploadedOn: 'Uploaded on',
    fileSize: 'File size',
    sortBy: { name: 'Sort by File name', uploadedAt: 'Sort by Uploaded on', size: 'Sort by File size' },
    selectFile: (name) => `Select ${name}`,
    deleteFile: 'Delete file',
    deleteNamed: (name) => `Delete ${name}`,
    noMatches: 'No files match your filters.',
    documents: 'Documents',
    spreadsheets: 'Spreadsheets',
    videos: 'Videos',
    downloadFile: 'Download file',
    rename: 'Rename',
    copyLink: 'Copy link',
  },
  tools: {
    showOutput: 'Show output',
    refreshTools: 'Refresh tools',
    removeServer: 'Remove server',
    logout: 'Logout',
    logOutOf: (server) => `Log out of ${server}`,
    showTools: (server) => `Show ${server} tools`,
    hideTools: (server) => `Hide ${server} tools`,
    error: 'Error',
    showOutputLink: 'Show Output',
    showOutputOf: (server) => `Show ${server} output`,
    newServer: 'New MCP Server',
    newServerDescription: 'Add a Custom MCP Server',
    projectScope: 'Project scope',
    authentication: 'Authentication',
    waitForAuth: 'Wait for MCP Authentication',
    waitForAuthDescription:
      'Wait indefinitely to authenticate when prompted. When off, skip authentication prompts after 30 seconds.',
    waitForAuthSwitch: 'Wait for MCP authentication',
    scopeServers: (scope) => `${scope} MCP Servers`,
    scopeServersDescription: (scope) => `Servers available from ${scope}.`,
    teamServers: 'Team MCP Servers',
    teamServersDescription: 'Configured in the dashboard',
    manage: 'Manage',
    noTeamServers: 'No Team MCP Servers',
    noTeamServersBody: 'Configure MCP servers in the dashboard to make them available on desktop and in the cloud.',
    configureTeam: 'Configure Team MCP Servers',
    pluginServers: 'Plugin MCP Servers',
  },
});
