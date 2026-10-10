import { defineMessages, type MessageCatalog } from '../locale/messages';

/** A default permission mode's name and one-line description. */
interface PermissionModeCopy {
  label: string;
  description: string;
}

/**
 * Every fixed string the composer-panel family draws or announces, in each
 * Bloom language: `ComposerPanel`, `ComposerPill`, `ModelPicker`,
 * `ComposerStatusBar`, `ComposerPanelStatusTab`, and the default data (the
 * permission modes, the effort stops, the add menu's rows) each draws when the
 * caller passes none. A caller's `labels` — and its own data — still win.
 */
export interface ComposerPanelMessages {
  /** The prompt's accessible name. */
  message: string;
  add: string;
  addMenu: string;
  permissions: string;
  permissionMode: string;
  learnMore: string;
  voice: string;
  send: string;
  /** Send's stop state while a turn is running. */
  stop: string;
  /** The permission chip's name, with the mode it is on. */
  permissionTrigger: (mode: string) => string;
  /** An attachment tile's dismiss, and a failed tile's retry. */
  removeFile: (name: string) => string;
  retryFile: (name: string) => string;
  /** `ComposerPanel`'s empty prompt. */
  panelPlaceholder: string;
  /** `ComposerPill`'s empty field, and its shorter form under 640 wide. */
  pillPlaceholder: string;
  pillCompactPlaceholder: string;
  modelSettings: string;
  models: string;
  /** The pill's model radio group. */
  modelGroup: string;
  effort: string;
  /** The effort value with no stop chosen. */
  effortAuto: string;
  faster: string;
  smarter: string;
  quickSearch: string;
  searchModels: string;
  closeSearch: string;
  noMatches: string;
  providers: string;
  /** The model list's name while searching, and while showing one provider. */
  matchingModels: string;
  providerModels: (provider: string) => string;
  /** `ComposerStatusBar`'s folder menu. */
  localFolders: string;
  /** The context meter's name. */
  context: (percent: number) => string;
  /** The six default effort stops, "Faster" → "Smarter". */
  effortLevels: readonly [string, string, string, string, string, string];
  permissionModes: {
    auto: PermissionModeCopy;
    manual: PermissionModeCopy;
    plan: PermissionModeCopy;
    bypass: PermissionModeCopy;
  };
  /** The default add menu's group titles, rows and row descriptions. */
  addMenuRows: {
    add: string;
    plugins: string;
    files: string;
    goal: string;
    goalDescription: string;
    plan: string;
    planDescription: string;
    documents: string;
    documentsDescription: string;
    spreadsheets: string;
    spreadsheetsDescription: string;
    presentations: string;
    presentationsDescription: string;
    code: string;
    codeDescription: string;
  };
}

export const COMPOSER_PANEL_MESSAGES: MessageCatalog<ComposerPanelMessages> =
  defineMessages<ComposerPanelMessages>('COMPOSER_PANEL_MESSAGES', {
    message: 'Message',
    add: 'Add attachment',
    addMenu: 'Add to chat',
    permissions: 'Permissions',
    permissionMode: 'Permission mode',
    learnMore: 'Learn more',
    voice: 'Voice input',
    send: 'Send message',
    stop: 'Stop generating',
    permissionTrigger: (mode) => `Permission: ${mode}`,
    removeFile: (name) => `Remove ${name}`,
    retryFile: (name) => `Retry ${name}`,
    panelPlaceholder: 'Hi, what do you need today?',
    pillPlaceholder: 'Ask me anything',
    pillCompactPlaceholder: 'Ask me',
    modelSettings: 'Model settings',
    models: 'Models',
    modelGroup: 'Model',
    effort: 'Effort',
    effortAuto: 'Auto',
    faster: 'Faster',
    smarter: 'Smarter',
    quickSearch: 'Quick Search',
    searchModels: 'Search models',
    closeSearch: 'Close search',
    noMatches: 'No models match',
    providers: 'Providers',
    matchingModels: 'Matching models',
    providerModels: (provider) => `${provider} models`,
    localFolders: 'Local Folders',
    context: (percent) => `Context ${percent}%`,
    effortLevels: ['Low', 'Medium', 'Balanced', 'High', 'Very High', 'Max'],
    permissionModes: {
      auto: { label: 'Auto', description: 'Agent decides by itself' },
      manual: { label: 'Manual', description: 'Always ask before making a change' },
      plan: { label: 'Plan mode', description: 'Create a plan before proceeding' },
      bypass: { label: 'Bypass all', description: 'Agent handles permission decisions' },
    },
    addMenuRows: {
      add: 'Add',
      plugins: 'Plugins',
      files: 'Files and folders',
      goal: 'Goal',
      goalDescription: 'Set a goal for faster results',
      plan: 'Plan mode',
      planDescription: 'Manage complex tasks',
      documents: 'Documents',
      documentsDescription: 'Create and edit documents',
      spreadsheets: 'Spreadsheets',
      spreadsheetsDescription: 'Generate spreadsheets',
      presentations: 'Presentations',
      presentationsDescription: 'Create marketing assets',
      code: 'Code blocks',
      codeDescription: 'Write and edit existing code',
    },
  });
