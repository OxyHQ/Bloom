import { defineMessages, type CatalogMessages } from '../locale/messages';
import { plural } from '../locale/plural';

export const MULTI_AGENT_CHAT_MESSAGES = defineMessages(
  'MULTI_AGENT_CHAT_MESSAGES',
  {
    pickerAction: (editing: boolean, count: number) =>
      editing
        ? 'Save changes'
        : 'Start chat' +
          (count
            ? ' · ' +
              plural('en', count, { one: '{n} agent', other: '{n} agents' })
            : ''),
    you: 'You',
    responseFailed: '{0} couldn’t respond. Please try again.',
    editAgentTitle: 'Edit agent',
    aLittleHelp: 'A little help',
    aFewMindsOneConversation: 'A few minds. One conversation.',
    aLittleRoomForSomethingNew: 'A little room for something new',
    accountDetails: 'Account Details',
    add: 'Add',
    add2: 'Add {0}',
    added: 'Added',
    addedToYourWorkspace: 'Added to your workspace',
    agent: 'Agent',
    agentConversation: 'Agent conversation',
    appearance: 'Appearance',
    apps: 'Apps · {0}',
    availability: 'Availability',
    backToMarketplace: 'Back to marketplace',
    billing: 'Billing',
    bitbucket: 'Bitbucket',
    bloom: 'Bloom',
    bots: 'Bots',
    bringYourAgentsIntoOneChat: 'Bring your agents into one chat.',
    category: 'Category',
    chatActions: 'Chat actions',
    chatList: 'Chat list',
    chatName: 'Chat name',
    chatRemoved: 'Chat removed',
    chatWithYourAgents: 'Chat with your agents',
    chooseAnAgentOrCreateYourOwn:
      'Choose an agent or create your own to start a conversation.',
    chooseWhoSJoiningTheConversation: 'Choose who’s joining the conversation.',
    chooseYourTeammates: 'Choose your teammates',
    closeMarketplace: 'Close marketplace',
    closeSearch: 'Close search',
    company: 'Company',
    companyDetails: 'Company Details',
    completionSound: 'Completion sound',
    connectedAccount: 'Connected account',
    connector: 'Connector',
    conversationIDCopied: 'Conversation ID copied',
    conversationCopied: 'Conversation copied',
    conversationOptions: 'Conversation options',
    conversations: 'Conversations',
    copied: 'Copied',
    copyConversation: 'Copy conversation',
    copyConversationID: 'Copy conversation ID',
    copyResponse: 'Copy response',
    couldnTCopyPleaseTryAgain: 'Couldn’t copy. Please try again.',
    create: 'Create',
    createANewBot: 'Create a new bot',
    createBotOrChat: 'Create bot or chat',
    criticalRequests: 'Critical requests',
    customize: 'Customize',
    customizeANewTeammate: 'Customize a new teammate.',
    dateOfBirth: 'Date of birth',
    demoIntegrationAddingSavesItToThis:
      'Demo integration. Adding saves it to this browser; no external account is connected.',
    desktopApp: 'Desktop app',
    details: 'Details',
    developer: 'Developer',
    deviceID: 'Device ID',
    discover: 'Discover',
    dispatchAlerts: 'Dispatch alerts',
    editConversationAgents: 'Edit conversation agents',
    editBot: 'Edit bot',
    editGroup: 'Edit group',
    editAgent: 'Edit {0}',
    email: 'Email',
    everydayEssentials: 'Everyday essentials',
    exploreMarketplace: 'Explore marketplace',
    explorePlugins: 'Explore plugins',
    explorePluginsAndBotsToBuildYour:
      'Explore plugins and bots to build your team.',
    findYourNextTeammate: 'Find your next teammate',
    findYourNextToolOrTeammate: 'Find your next tool or teammate',
    firstName: 'First name',
    folders: 'Folders',
    general: 'General',
    getNotifiedWhenTheModeNeedsTo:
      'Get notified when the mode needs to make a critical decision',
    git: 'Git',
    github: 'GitHub',
    gitlab: 'GitLab',
    helpfulResponse: 'Helpful response',
    inTheBrowser: 'In the browser',
    inThisConversation: 'In this conversation',
    includes: 'Includes',
    insideTheApp: 'Inside the app',
    installed: 'Installed',
    integrations: 'Integrations',
    iLlApproachThisFromThePerspective:
      'I’ll approach this from the perspective of {0}.',
    lastName: 'Last name',
    limits: 'Limits',
    logOutFromAllDevices: 'Log out from all devices',
    logout: 'Logout',
    manage: 'Manage',
    manageLimits: 'Manage limits',
    marketplace: 'Marketplace',
    marketplaceLinkCopied: 'Marketplace link copied',
    marketplaceListings: 'Marketplace listings',
    meetYourNextTeammate: 'Meet your next teammate',
    messages: 'Messages',
    noConversationsFound: 'No conversations found.',
    noMatchesYet: 'No matches yet',
    notifications: 'Notifications',
    openConversations: 'Open conversations',
    openPullRequestLinksInsideYourApp:
      'Open pull request links inside your app',
    openTheMarketplaceToExplorePluginsAnd:
      'Open the Marketplace to explore plugins and bots. Use a conversation’s menu to edit its bot’s appearance and details. Choose an expression from the emotion wheel. Scroll or drag the shape arc, or use its arrow keys, to explore the shapes.',
    prDestination: 'PR destination',
    people: 'People',
    personal: 'Personal',
    pinChat: 'Pin chat',
    pinnedChat: 'Pinned chat',
    plugins: 'Plugins',
    profile: 'Profile',
    public: 'Public',
    publicProfile: 'Public profile',
    pullRequests: 'Pull Requests',
    pushNotificationOnYourPhoneWhenThe:
      'Push notification on your phone when the app messages you',
    remove: 'Remove',
    removeChat: 'Remove chat',
    renameChat: 'Rename chat',
    responseCopied: 'Response copied',
    reviewProvider: 'Review provider',
    rulesAndWorkflows: 'Rules and Workflows',
    saveName: 'Save name',
    sayHelloTo: 'Say hello to {0}',
    searchConversations: 'Search conversations',
    searchConversations2: 'Search conversations…',
    searchMarketplace: 'Search marketplace',
    selectGithubOrOtherProvidersForReviews:
      'Select Github or other providers for reviews',
    selectedAgents: 'Selected agents: {0}',
    sendWithEnterUseShiftEnterFor:
      'Send with Enter. Use Shift + Enter for a new line. Your changes stay in this browser.',
    settings: 'Settings',
    share: 'Share',
    showFundamentalNotificationsWhenAnAgentCompletes:
      'Show fundamental notifications when an agent completes a task',
    signOut: 'Sign out',
    skills: 'Skills',
    skills2: 'Skills · {0}',
    soundEffectATaskIsCompleted: 'Sound effect a task is completed',
    startAConversation: 'Start a conversation',
    startAGroupChat: 'Start a group chat',
    startChat: 'Start chat',
    storage: 'Storage',
    support: 'Support',
    systemNotifications: 'System notifications',
    thinkingTogether: 'Thinking together…',
    thinking: 'Thinking…',
    today: 'Today',
    tools: 'Tools',
    toolsForYourWorkflow: 'Tools for your workflow',
    tryAnotherNameCategoryOrKeyword: 'Try another name, category, or keyword.',
    ultra149Mo: 'Ultra $149/mo',
    unhelpfulResponse: 'Unhelpful response',
    unpinChat: 'Unpin chat',
    upgradeToMax: 'Upgrade to Max',
    useToCreateABotOrStart:
      'Use + to create a bot or start a conversation with several agents.',
    viewAdded: 'View added {0}',
    viewAll: 'View all',
    viewTeamProfile: 'View team profile',
    viewItem: 'View {0}',
    website: 'Website',
    whenEnabledYourProfilePageWillBe:
      'When enabled your profile page will be visible to anyone',
    youAreOn7xMoreUsageThan: 'You are on 7x more usage than Premium',
    youAreOn7xMoreUsageThan2: 'You are on 7x more usage than Regular.',
    areHereSendAMessageToGet:
      '{0} are here. Send a message to get everyone’s perspective.',
    itemDetails: '{0} details',
    agentThinking: '{0} is thinking',
    by: '{0} · by {1}',
    results: (count: number) =>
      plural('en', count, { one: '{n} result', other: '{n} results' }),
    includedSkills: (apps: number, skills: number) =>
      (apps
        ? plural('en', apps, { one: '{n} app', other: '{n} apps' }) + ', '
        : '') + plural('en', skills, { one: '{n} skill', other: '{n} skills' }),
  },
);

export type MultiAgentChatMessages = CatalogMessages<
  typeof MULTI_AGENT_CHAT_MESSAGES
>;

/** Keep dynamic names/counts in their translated grammatical position. */
export function formatChatMessage(
  template: string,
  ...values: unknown[]
): string {
  return template.replace(/\{(\d+)\}/g, (_match, index: string) =>
    String(values[Number(index)] ?? ''),
  );
}
