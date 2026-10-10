import { FOLD_CONFIG, type AvatarConfig } from '../agent-avatar/model';
import { conversationFor, type Workspace } from './data';

export type MarketplaceItem = {
  id: string;
  name: string;
  kind: 'plugin' | 'bot';
  category: string;
  description: string;
  detail: string;
  developer: string;
  website: string;
  logo?:
    | 'notion'
    | 'figma'
    | 'github'
    | 'slack'
    | 'gmail'
    | 'drive'
    | 'calendar'
    | 'appwrite'
    | 'linear'
    | 'aws';
  avatar?: AvatarConfig;
  apps: string[];
  skills: { name: string; description: string }[];
};

const plugin = (
  id: NonNullable<MarketplaceItem['logo']>,
  name: string,
  category: string,
  description: string,
  detail: string,
  developer: string,
  website: string,
  skill: string,
): MarketplaceItem => ({
  id,
  name,
  kind: 'plugin',
  category,
  description,
  detail,
  developer,
  website,
  logo: id,
  apps: [name],
  skills: [{ name: skill, description }],
});
const bot = (
  id: string,
  name: string,
  category: string,
  description: string,
  detail: string,
  avatar: Partial<AvatarConfig>,
  skills: MarketplaceItem['skills'],
): MarketplaceItem => ({
  id,
  name,
  kind: 'bot',
  category,
  description,
  detail,
  developer: 'Bloom',
  website: 'https://oxy.so',
  avatar: { ...FOLD_CONFIG, ...avatar },
  apps: [],
  skills,
});

/** A local demo catalog. Adding a plugin does not authenticate a third-party account. */
export const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  plugin(
    'notion',
    'Notion',
    'Productivity',
    'Bring your notes, docs, and projects together.',
    'Give your agents a place to find project context, organize notes, and turn ideas into useful documents. Keep knowledge close to the conversation.',
    'Notion',
    'https://www.notion.so',
    'Workspace knowledge',
  ),
  plugin(
    'figma',
    'Figma',
    'Design',
    'Keep designs and conversations in sync.',
    'Bring design context into your conversations. Explore layouts, discuss components, and turn design feedback into a clear next step.',
    'Figma',
    'https://www.figma.com',
    'Design collaboration',
  ),
  plugin(
    'linear',
    'Linear',
    'Project management',
    'Turn the next step into an issue.',
    'Keep the team’s work in view with project and issue context. Help agents organize follow-ups and break a big idea into manageable tasks.',
    'Linear',
    'https://linear.app',
    'Issue planning',
  ),
  plugin(
    'appwrite',
    'Appwrite',
    'Development',
    'A little help with your application backend.',
    'Plan authentication, databases, storage, and backend functions with an agent that understands the building blocks of your application.',
    'Appwrite',
    'https://appwrite.io',
    'Backend development',
  ),
  plugin(
    'gmail',
    'Gmail',
    'Communication',
    'Find the important details in your inbox.',
    'Bring email context into your workflow. Find conversations, summarize long threads, and prepare thoughtful drafts with your agent.',
    'Google',
    'https://mail.google.com',
    'Email assistance',
  ),
  plugin(
    'calendar',
    'Google Calendar',
    'Productivity',
    'Make a little more room in your day.',
    'Help your agent understand your schedule, prepare for upcoming meetings, and find time for the work that matters.',
    'Google',
    'https://calendar.google.com',
    'Schedule planning',
  ),
  plugin(
    'drive',
    'Google Drive',
    'Productivity',
    'Your files, right where you need them.',
    'Find supporting documents, explore shared knowledge, and bring relevant files into a conversation without losing the thread.',
    'Google',
    'https://drive.google.com',
    'File discovery',
  ),
  plugin(
    'slack',
    'Slack',
    'Communication',
    'Catch up with your team’s conversations.',
    'Gather context from team discussions, summarize decisions, and prepare updates that keep everyone on the same page.',
    'Slack',
    'https://slack.com',
    'Team updates',
  ),
  plugin(
    'github',
    'GitHub',
    'Development',
    'Explore code, issues, and pull requests.',
    'Give your agent repository context to explain code, review changes, and help turn issues into a clear implementation plan.',
    'GitHub',
    'https://github.com',
    'Code review',
  ),
  plugin(
    'aws',
    'Amazon Location Service',
    'Infrastructure',
    'Build with maps, places, and routes.',
    'Explore adding maps, place search, geocoding, and routing to your application with Amazon Location Service. Work through integration plans and implementation questions.',
    'Amazon Web Services',
    'https://aws.amazon.com/location/',
    'Location services',
  ),
  bot(
    'pitch-partner',
    'Pitch partner',
    'Writing',
    'Find the words that make your idea click.',
    'A thoughtful writing partner for pitches, introductions, and the story behind your product. Explore a few directions, sharpen your message, and keep your own voice.',
    { foldShape: 'petal', hue: 24, saturation: 72, eyes: 'happy', seed: 117 },
    [
      {
        name: 'Storytelling',
        description: 'Shape a clear, memorable narrative around your idea.',
      },
    ],
  ),
  bot(
    'meeting-notes',
    'Meeting notes',
    'Productivity',
    'Good conversations deserve clear next steps.',
    'Turn pasted meeting notes into a useful recap. Pull out decisions, open questions, and action items so the next step is easy to see.',
    {
      foldShape: 'pocket',
      hue: 157,
      saturation: 39,
      eyes: 'curious',
      seed: 143,
    },
    [
      {
        name: 'Meeting summaries',
        description: 'Organize decisions, owners, and follow-up tasks.',
      },
    ],
  ),
  bot(
    'launch-planner',
    'Launch planner',
    'Marketing',
    'From a promising idea to launch day.',
    'Plan a focused launch with an agent that keeps the audience, message, and next milestone in view. Build a checklist and refine the details as you go.',
    { foldShape: 'star', hue: 252, saturation: 64, eyes: 'excited', seed: 179 },
    [
      {
        name: 'Launch planning',
        description: 'Create a practical launch timeline and campaign outline.',
      },
    ],
  ),
  bot(
    'code-reviewer',
    'Code reviewer',
    'Development',
    'A fresh pair of eyes on your next change.',
    'Talk through pasted code and review changes for clarity, edge cases, and maintainability. Get actionable feedback with enough context to understand the tradeoffs.',
    {
      foldShape: 'flower',
      hue: 204,
      saturation: 65,
      eyes: 'thinking',
      seed: 211,
    },
    [
      {
        name: 'Code feedback',
        description: 'Review implementation choices and spot overlooked edge cases.',
      },
    ],
  ),
  bot(
    'design-partner',
    'Design partner',
    'Design',
    'Turn a rough idea into a thoughtful interface.',
    'Explore layouts, refine visual hierarchy, and talk through the details that make an interface feel natural. Bring a brief or describe a screen to get practical design feedback.',
    { foldShape: 'heart', hue: 329, saturation: 62, eyes: 'happy', seed: 239 },
    [
      {
        name: 'Interface feedback',
        description: 'Refine layouts, interaction patterns, and visual hierarchy.',
      },
    ],
  ),
  bot(
    'research-scout',
    'Research scout',
    'Research',
    'Find the useful signals in your research.',
    'Make sense of pasted articles, interview notes, and research findings. Compare perspectives, separate evidence from assumptions, and identify questions worth exploring next.',
    {
      foldShape: 'diamond',
      hue: 46,
      saturation: 73,
      eyes: 'curious',
      seed: 263,
    },
    [
      {
        name: 'Research synthesis',
        description: 'Connect findings, surface themes, and flag gaps in the evidence.',
      },
    ],
  ),
  bot(
    'data-analyst',
    'Data analyst',
    'Analytics',
    'Make the numbers easier to understand.',
    'Walk through the data you share and turn patterns into clear explanations. Explore useful comparisons, question unexpected results, and choose how to present your findings.',
    {
      foldShape: 'shield',
      hue: 185,
      saturation: 53,
      eyes: 'focused',
      seed: 293,
    },
    [
      {
        name: 'Data interpretation',
        description: 'Explain trends, compare metrics, and suggest useful visualizations.',
      },
    ],
  ),
  bot(
    'support-guide',
    'Support guide',
    'Support',
    'A little clarity for every customer question.',
    'Draft helpful replies from the customer questions and product context you provide. Break troubleshooting into simple steps and keep the tone warm, clear, and consistent.',
    { foldShape: 'cloud', hue: 112, saturation: 42, eyes: 'calm', seed: 317 },
    [
      {
        name: 'Customer replies',
        description: 'Prepare thoughtful responses and easy-to-follow troubleshooting steps.',
      },
    ],
  ),
];

export const DEFAULT_PLUGINS = ['gmail', 'calendar', 'drive', 'slack'];
export const marketplaceAgentId = (id: string) => `marketplace-${id}`;
export function filterMarketplace(query: string, kind: 'all' | 'plugin' | 'bot' = 'all') {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return MARKETPLACE_ITEMS.filter(
    (item) =>
      (kind === 'all' || item.kind === kind) &&
      terms.every((term) =>
        `${item.name} ${item.description} ${item.category} ${item.developer}`
          .toLocaleLowerCase()
          .includes(term),
      ),
  );
}
export function addMarketplaceBot(workspace: Workspace, item: MarketplaceItem): Workspace {
  const id = marketplaceAgentId(item.id);
  if (item.kind !== 'bot' || !item.avatar || workspace.agents.some((agent) => agent.id === id))
    return workspace;
  const agent = {
    id,
    name: item.name,
    label: item.category,
    description: item.description,
    avatar: { ...item.avatar },
  };
  const chat = conversationFor([agent], [id], `chat-${id}`);
  return {
    ...workspace,
    agents: [...workspace.agents, agent],
    chats: [chat, ...workspace.chats],
  };
}
