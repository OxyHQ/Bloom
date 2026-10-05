import {
  FOLD_CONFIG,
  parsePreset,
  type AvatarConfig,
} from '../agent-avatar/model';
import { pickMessages } from '../locale/messages';
import { MULTI_AGENT_CHAT_MESSAGES, formatChatMessage } from './messages';

import { normalizeAgentPreferences } from '../agent-creator/shared';
import type { AgentCreatorAgent } from '../agent-creator/types';
export type Agent = AgentCreatorAgent;
export type Message = {
  id: string;
  role: 'user' | 'agent';
  agentId?: string;
  text: string;
  example?: boolean;
};
export type Conversation = {
  id: string;
  title: string;
  customTitle?: string;
  pinned?: boolean;
  agentIds: string[];
  messages: Message[];
};
export type Workspace = {
  agents: Agent[];
  chats: Conversation[];
  activeId: string;
  installedPlugins?: string[];
};

const NEW_AGENT_IDENTITIES = [
  {
    name: 'Product planner',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'diamond',
      hue: 215,
      saturation: 70,
      eyes: 'curious',
      seed: 71,
    },
  },
  {
    name: 'Cloud engineer',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'cloud',
      hue: 18,
      saturation: 76,
      eyes: 'thinking',
      seed: 82,
    },
  },
  {
    name: 'Support guide',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'heart',
      hue: 135,
      saturation: 48,
      eyes: 'happy',
      seed: 93,
    },
  },
] satisfies Pick<Agent, 'name' | 'avatar'>[];

/** Choose an unused identity, including when restoring old unnamed demo bots. */
export function nextAgentIdentity(
  agents: Pick<Agent, 'name'>[],
): Pick<Agent, 'name' | 'avatar'> {
  const names = new Set(agents.map((agent) => agent.name.toLowerCase()));
  let index = 0;
  while (true) {
    const identity = NEW_AGENT_IDENTITIES[index % NEW_AGENT_IDENTITIES.length]!;
    const cycle = Math.floor(index / NEW_AGENT_IDENTITIES.length);
    const name = cycle ? `${identity.name} ${cycle + 1}` : identity.name;
    if (!names.has(name.toLowerCase()))
      return {
        name,
        avatar: {
          ...identity.avatar,
          hue: (identity.avatar.hue + cycle * 47) % 360,
          seed: identity.avatar.seed + cycle,
        },
      };
    index++;
  }
}

const ADDITIONAL_AGENTS: Agent[] = [
  {
    id: 'product',
    ...NEW_AGENT_IDENTITIES[0]!,
    label: 'Product',
    description:
      'Turns ideas into clear priorities, practical roadmaps, and manageable next steps.',
  },
  {
    id: 'cloud',
    ...NEW_AGENT_IDENTITIES[1]!,
    label: 'Cloud',
    description:
      'Helps with server architecture, cloud infrastructure, deployments, and reliable services.',
  },
  {
    id: 'support',
    ...NEW_AGENT_IDENTITIES[2]!,
    label: 'Support',
    description:
      'Finds helpful answers and makes every customer conversation feel clear and personal.',
  },
  {
    id: 'data',
    name: 'Data analyst',
    label: 'Analytics',
    description:
      'Turns data into clear insights, useful charts, and practical decisions.',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'pocket',
      hue: 205,
      saturation: 62,
      eyes: 'focused',
      seed: 104,
    },
  },
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'design',
    name: 'landing page designer',
    label: 'Design',
    description:
      'Thoughtful layouts, clear hierarchy, and a little personality for your next landing page.',
    avatar: {
      ...FOLD_CONFIG,
      hue: 157,
      saturation: 37,
      eyes: 'curious',
      seed: 12,
    },
  },
  {
    id: 'content',
    name: 'content reviewer',
    label: 'Writing',
    description: 'Makes your writing clear, concise, and unmistakably yours.',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'pocket',
      hue: 25,
      saturation: 60,
      eyes: 'thinking',
      seed: 29,
    },
  },
  {
    id: 'marketing',
    name: 'marketing bot',
    label: 'Marketing',
    description: 'Turns a good idea into a campaign people remember.',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'star',
      hue: 179,
      saturation: 47,
      eyes: 'happy',
      seed: 37,
    },
  },
  {
    id: 'seo',
    name: 'seo bot',
    label: 'SEO',
    description: 'Helps the right people discover your work through search.',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'flower',
      hue: 253,
      saturation: 65,
      eyes: 'neutral',
      seed: 42,
    },
  },
  {
    id: 'research',
    name: 'research assistant',
    label: 'Research',
    description:
      'Connects the dots, asks better questions, and brings the evidence.',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'petal',
      hue: 43,
      saturation: 80,
      eyes: 'thinking',
      seed: 53,
    },
  },
  {
    id: 'security',
    name: 'Security agent',
    label: 'Security',
    description:
      'A careful second pair of eyes for permissions, privacy, and application security.',
    avatar: {
      ...FOLD_CONFIG,
      foldShape: 'shield',
      hue: 181,
      saturation: 49,
      eyes: 'neutral',
      grain: 8,
      seed: 64,
    },
  },
  ...ADDITIONAL_AGENTS,
];

const SAMPLE_CONVERSATIONS: Record<string, { prompt: string; reply: string }> =
  {
    design: {
      prompt: 'How can we make the landing page feel clearer?',
      reply:
        'Give the hero one clear action. Lead with the outcome, pair it with a focused product preview, and move the secondary links below the fold.\n\nFor the next section, show three concrete benefits with short examples. That creates a natural path from understanding the product to trying it.',
    },
    content: {
      prompt: 'Can you help tighten our welcome email?',
      reply:
        'The shorter opening feels more welcoming. Start with a quick thank-you, explain the first useful step, and keep the main button close to that instruction.\n\nSave the feature tour for a follow-up. A new customer should leave this email knowing exactly where to begin.',
    },
    marketing: {
      prompt: 'What should our launch campaign focus on?',
      reply:
        'Lead with the problem your audience recognizes. Build the campaign around one before-and-after story, then adapt it for email, social, and the launch page.\n\nTry two opening lines with a small audience first. Use the response to choose a direction before expanding the campaign.',
    },
    seo: {
      prompt: 'Help me plan a useful topic cluster for our blog.',
      reply:
        'Start with a practical guide to the core topic. Support it with focused articles that answer the next questions readers are likely to ask.\n\nLink each article back to the guide and to one related next step. Clear titles and useful examples will make the structure easier for people to navigate.',
    },
    research: {
      prompt: 'How should we prepare for customer interviews?',
      reply:
        'Ask about the last time the problem happened. Have customers walk through what they tried, where they got stuck, and what a good result would have looked like.\n\nKeep the first five interviews focused on the same questions. Compare the patterns afterward before deciding which assumption to test next.',
    },
    security: {
      prompt: 'What should we check before sharing the beta?',
      reply:
        'Review access permissions before inviting testers. Confirm that every request checks the current user’s access and that one account cannot read another account’s data.\n\nThen check the password-reset flow, uploaded files, and sensitive information in logs. Keep a short checklist so the same checks run before each release.',
    },
    product: {
      prompt: 'Can you help prioritize our first release?',
      reply:
        'Keep the first release focused on one complete journey. Pick the three things someone must be able to do to reach the main outcome, and move supporting ideas into a later list.\n\nGive each priority a clear success condition. That makes it easier to decide whether the release is ready without adding more features.',
    },
    cloud: {
      prompt: 'How should we approach our staging deployment?',
      reply:
        'Give staging its own environment and data. Match the production configuration closely, while keeping credentials, storage, and deployment permissions separate.\n\nAdd a health check and a simple rollback path before automating releases. Then use a small deployment to verify logs, startup behavior, and connectivity.',
    },
    support: {
      prompt: 'Help me write a reply to a customer whose import failed.',
      reply:
        'Acknowledge the failed import and offer one clear next step. Ask for the file type and the error they saw, then explain what you will check with that information.\n\nKeep the reply warm and specific. Let them know when to expect an update so they do not have to chase the conversation.',
    },
    data: {
      prompt: 'Which numbers should we include in the weekly dashboard?',
      reply:
        'Track activation alongside weekly retention. Those two measures help show whether new people reach value and whether they come back after the first visit.\n\nBreak the results down by signup week and acquisition source. Add a short note about unusual changes so the dashboard helps people decide what to investigate.',
    },
  };

function sampleMessages(agentId: string): Message[] {
  const sample = SAMPLE_CONVERSATIONS[agentId];
  if (!sample) return [];
  return [
    { id: `sample-request-${agentId}`, role: 'user', text: sample.prompt },
    {
      id: `sample-reply-${agentId}`,
      role: 'agent',
      agentId,
      example: true,
      text: sample.reply,
    },
  ];
}

const STARTER_CHAT_AGENT_IDS = new Set([
  'design',
  'content',
  'marketing',
  'seo',
  'research',
  'security',
  'cloud',
]);

export const INITIAL_WORKSPACE: Workspace = {
  agents: INITIAL_AGENTS,
  activeId: 'chat-design',
  chats: INITIAL_AGENTS.filter((agent) =>
    STARTER_CHAT_AGENT_IDS.has(agent.id),
  ).map((agent) => ({
    id: `chat-${agent.id}`,
    title: agent.name,
    agentIds: [agent.id],
    messages: sampleMessages(agent.id),
  })),
};

/** Restored data is bounded and validated before it reaches the animated renderer. */
export function restoreWorkspace(raw: string): Workspace | null {
  try {
    const data = JSON.parse(raw);
    if (
      !data ||
      !Array.isArray(data.agents) ||
      !Array.isArray(data.chats) ||
      !data.agents.length ||
      data.agents.length > 100 ||
      data.chats.length > 200
    )
      return null;
    let agents: Agent[] = data.agents.map((a: Agent) => {
      if (
        !a ||
        typeof a.id !== 'string' ||
        typeof a.name !== 'string' ||
        !a.name.trim() ||
        typeof a.label !== 'string' ||
        typeof a.description !== 'string'
      )
        throw new Error('Invalid agent');
      return {
        id: a.id.slice(0, 100),
        name: a.name.slice(0, 48),
        label: a.label.slice(0, 60),
        description: a.description.slice(0, 500),
        ...(a.preferences
          ? { preferences: normalizeAgentPreferences(a.preferences) }
          : {}),
        avatar: {
          ...parsePreset({ name: a.name, config: a.avatar }).config,
          family: 'fold',
          lookAt: 'wander',
        },
      };
    });
    const renamed = new Set<string>();
    for (const agent of agents) {
      if (agent.name.trim().toLowerCase() !== 'new bot') continue;
      Object.assign(agent, nextAgentIdentity(agents));
      renamed.add(agent.id);
    }
    const ids = new Set(agents.map((a) => a.id));
    if (ids.size !== agents.length) return null;
    let chats: Conversation[] = data.chats.map((c: Conversation) => {
      if (
        !c ||
        typeof c.id !== 'string' ||
        typeof c.title !== 'string' ||
        !Array.isArray(c.agentIds) ||
        !c.agentIds.length ||
        c.agentIds.some((id) => !ids.has(id)) ||
        new Set(c.agentIds).size !== c.agentIds.length ||
        !Array.isArray(c.messages) ||
        c.messages.length > 1000
      )
        throw new Error('Invalid conversation');
      let messages = c.messages.map((m) => {
        if (
          !m ||
          typeof m.id !== 'string' ||
          typeof m.text !== 'string' ||
          !['user', 'agent'].includes(m.role) ||
          (m.role === 'agent' && (!m.agentId || !ids.has(m.agentId)))
        )
          throw new Error('Invalid message');
        return {
          id: m.id,
          role: m.role,
          ...(m.agentId ? { agentId: m.agentId } : {}),
          text: m.text.slice(0, 20000),
          ...(m.example === true ? { example: true } : {}),
        };
      });
      const sampleAgentId = c.agentIds[0]!;
      if (
        c.agentIds.length === 1 &&
        c.id === `chat-${sampleAgentId}` &&
        SAMPLE_CONVERSATIONS[sampleAgentId] &&
        messages.every(
          (message) =>
            message.id === `intro-${sampleAgentId}` ||
            (sampleAgentId === 'design' && message.id === 'request-design'),
        )
      ) {
        messages = sampleMessages(sampleAgentId);
      }
      const renamedAgent =
        c.agentIds.length === 1 && renamed.has(c.agentIds[0]!)
          ? agents.find((a) => a.id === c.agentIds[0])
          : undefined;
      return {
        id: c.id,
        title:
          renamedAgent && c.title.trim().toLowerCase() === 'new bot'
            ? renamedAgent.name
            : c.title.slice(0, 100),
        agentIds: c.agentIds,
        messages,
        ...(typeof c.customTitle === 'string' && c.customTitle.trim()
          ? { customTitle: c.customTitle.trim().slice(0, 100) }
          : {}),
        ...(typeof c.pinned === 'boolean' ? { pinned: c.pinned } : {}),
      };
    });
    if (new Set(chats.map((c) => c.id)).size !== chats.length) return null;
    // Retire unused demo additions; keep any customized agent or conversation with real messages.
    const retiredNames: Record<string, string> = {
      qa: 'QA tester',
      notes: 'Meeting notes',
      brand: 'Brand strategist',
    };
    const retired = new Set(
      agents
        .filter(
          (agent) =>
            retiredNames[agent.id] === agent.name &&
            !chats.some(
              (chat) =>
                chat.agentIds.includes(agent.id) &&
                (chat.agentIds.length > 1 ||
                  chat.messages.some(
                    (message) => message.id !== `intro-${agent.id}`,
                  )),
            ),
        )
        .map((agent) => agent.id),
    );
    agents = agents.filter((agent) => !retired.has(agent.id));
    chats = chats.filter(
      (chat) => !chat.agentIds.some((id) => retired.has(id)),
    );
    // Remove only untouched surplus starter chats; keep all agents available in the picker.
    chats = chats.filter((chat) => {
      const agent = agents.find(
        (agent) => agent.id === (chat.agentIds[0] ?? ''),
      );
      const original = INITIAL_AGENTS.find(
        (initial) => initial.id === agent?.id,
      );
      if (
        !agent ||
        !original ||
        STARTER_CHAT_AGENT_IDS.has(agent.id) ||
        chat.id !== `chat-${agent.id}` ||
        chat.agentIds.length !== 1 ||
        chat.customTitle ||
        chat.pinned ||
        chat.title !== original.name
      )
        return true;
      const customized =
        agent.name !== original.name ||
        agent.label !== original.label ||
        agent.description !== original.description ||
        agent.preferences ||
        Object.entries(original.avatar).some(
          ([key, value]) => agent.avatar[key as keyof AvatarConfig] !== value,
        );
      const samples = sampleMessages(agent.id);
      const untouched =
        chat.messages.length === samples.length &&
        chat.messages.every((message, index) =>
          Object.entries(samples[index]!).every(
            ([key, value]) => message[key as keyof Message] === value,
          ),
        );
      return !!customized || !untouched;
    });
    // Upgrade older demos without replacing edited agents, chats, or prior renamed placeholders.
    for (const agent of ADDITIONAL_AGENTS) {
      if (agents.length >= 100 || chats.length >= 200) break;
      if (
        agents.some(
          (existing) =>
            existing.id === agent.id ||
            existing.name.toLowerCase() === agent.name.toLowerCase(),
        )
      )
        continue;
      agents.push({ ...agent, avatar: { ...agent.avatar } });
      if (!STARTER_CHAT_AGENT_IDS.has(agent.id)) continue;
      let chatId = `chat-${agent.id}`;
      while (chats.some((chat) => chat.id === chatId)) chatId += '-new';
      chats.push({
        id: chatId,
        title: agent.name,
        agentIds: [agent.id],
        messages: sampleMessages(agent.id),
      });
    }
    const installedPlugins = Array.isArray(data.installedPlugins)
      ? ([
          ...new Set(
            data.installedPlugins.filter(
              (id: unknown): id is string =>
                typeof id === 'string' && /^[a-z-]{1,40}$/.test(id),
            ),
          ),
        ].slice(0, 100) as string[])
      : undefined;
    return {
      agents,
      chats,
      ...(installedPlugins ? { installedPlugins } : {}),
      activeId: chats.some((c) => c.id === data.activeId)
        ? data.activeId
        : (chats[0]?.id ?? ''),
    };
  } catch {
    return null;
  }
}

export function conversationFor(
  agents: Agent[],
  ids: string[],
  id: string,
): Conversation {
  const selected = [...new Set(ids)].flatMap(
    (id) => agents.find((agent) => agent.id === id) ?? [],
  );
  return {
    id,
    title: selected.map((a) => a.label || a.name).join(' + '),
    agentIds: selected.map((a) => a.id),
    messages: [],
  };
}

/** Update membership without dropping historical replies or changing the conversation identity. */
export function updateConversationAgents(
  workspace: Workspace,
  chatId: string,
  agentIds: string[],
): Workspace {
  const membership = conversationFor(workspace.agents, agentIds, chatId);
  if (!membership.agentIds.length) return workspace;
  return {
    ...workspace,
    chats: workspace.chats.map((chat) =>
      chat.id === chatId
        ? { ...chat, agentIds: membership.agentIds, title: membership.title }
        : chat,
    ),
  };
}

export function removeConversation(
  workspace: Workspace,
  chatId: string,
): Workspace {
  const chats = workspace.chats.filter((chat) => chat.id !== chatId);
  return {
    ...workspace,
    chats,
    activeId:
      workspace.activeId === chatId ? (chats[0]?.id ?? '') : workspace.activeId,
  };
}

/** Ten authored directions, rotated per agent so follow-up messages stay varied. */
export const DEMO_ANSWERS = [
  'Start with the smallest useful version: pick one audience and one outcome, make the main action easy to find, and remove anything that competes with it. A focused first pass makes the next decision much easier.\n\nOnce the core experience works, we can add supporting details where they answer a real question. That keeps the first impression simple without losing the depth people need to feel confident.',
  'I’d explore two directions before committing. One can be calm and familiar, with a clear structure; the other can be more expressive, with one memorable detail. Keep the underlying content the same so the comparison is fair.\n\nChoose the direction that communicates the idea fastest, then refine its strongest elements. We don’t need to combine everything from both versions; a clear point of view will make the result feel more intentional.',
  'Let’s work backward from the moment someone gets value. Think about what they should understand first, what they need to trust, and the next useful step. Answer those in that order, then build the experience around them.\n\nThat gives us a clear path without adding extra steps. If a detail doesn’t help someone understand, decide, or act, we can move it further down or leave it for a later iteration.',
  'A quick review would help here. Check whether the main promise is specific, every section answers a real question, and the important details are easy to scan. The next step should feel obvious without needing extra explanation.\n\nI’d fix the biggest point of confusion before polishing smaller details. Once that is resolved, a second pass can focus on consistency and the subtle touches that make the experience feel finished.',
  'I’d simplify the first impression by leading with the outcome, supporting it with one concrete example, and moving secondary details further down. Someone should be able to explain the idea after a quick glance.\n\nWe can add depth where people need it without making the opening feel busy. Short, descriptive labels and a clear order will help the supporting content feel connected to the main idea.',
  'There’s an opportunity to make this feel more personal. Use language your audience already uses and show a recognizable situation instead of an abstract promise. Let a small detail carry the personality while the rest stays easy to follow.\n\nConsistency will make that detail feel intentional. Repeating the same tone and visual cues in a few useful places is more effective than adding a different flourish to every part of the experience.',
  'Before expanding this, I’d validate the core assumption. Write down what we expect someone to do, then give a few people a realistic task. Watch where they hesitate and ask what they expected to happen.\n\nThose moments will tell us more than asking whether they like it. Look for patterns across the sessions, choose the most common source of confusion, and make one focused improvement before testing again.',
  'Let’s check the less obvious states, too. Think about a first visit, an empty result, a long answer, a slow connection, and a small screen. Each should still make sense and offer a useful next step.\n\nHandling those cases early makes the whole experience feel more considered. We can keep the solutions simple, as long as people understand what is happening and how to continue.',
  'I’d turn this into three manageable passes. Start with structure so the order and main action are clear, then refine the wording, examples, and supporting elements. Finally, review the result against the original goal.\n\nFinish one pass before adding more scope. That makes feedback easier to act on and helps us distinguish a structural problem from something that only needs a small adjustment.',
  'For the next iteration, change one meaningful thing. Choose the part with the most uncertainty, define what improvement would look like, and compare it with the current version. Keep the rest consistent so we can understand the result.\n\nThen use what we learn to decide the next step. A series of focused changes will give us a clearer direction than a large revision where it is difficult to tell which decisions helped.',
] as const;

/** Bring previously saved demo replies into the current paragraph treatment. */
export function formatDemoReply(text: string): string {
  const footer = '\n\nThis is a sample response from the interactive template.';
  if (!text.startsWith('For “') || !text.endsWith(footer)) return text;
  const body = text
    .slice(0, -footer.length)
    .replace(/^For “[\s\S]*?”:\n\n/u, '');
  const paragraphs = body.split(/\n\s*\n/u);
  return [paragraphs.slice(0, 2).join(' '), paragraphs.slice(2).join(' ')]
    .filter(Boolean)
    .join('\n\n');
}

export function demoReply(agent: Agent, turn = 0): string {
  const messages = pickMessages(MULTI_AGENT_CHAT_MESSAGES, undefined);
  const suggestions: Record<string, string> = {
    design:
      'I’d start with one clear headline, a strong visual hierarchy, and a single primary action. Then check the layout at mobile and desktop sizes.',
    content:
      'I’d clarify the main takeaway, shorten the opening, and replace vague claims with a concrete example. Keep the voice consistent throughout.',
    marketing:
      'I’d define the audience and the promise first, then explore three campaign angles. Test one message at a time so the results are useful.',
    seo: 'I’d map the search intent, organize the page around a focused topic, and check the title, headings, and internal links.',
    research:
      'I’d turn this into a few specific questions, collect primary sources, and separate what we know from what needs validation.',
    security:
      'I’d begin by mapping the data flow and access boundaries, then review permissions, input validation, and how sensitive information is stored.',
  };
  const offset = Math.max(
    0,
    INITIAL_AGENTS.findIndex((a) => a.id === agent.id),
  );
  const answer =
    DEMO_ANSWERS[
      (Math.max(0, Math.floor(turn)) + offset) % DEMO_ANSWERS.length
    ];
  return `${suggestions[agent.id] ?? formatChatMessage(messages.iLlApproachThisFromThePerspective, agent.label || agent.name)} ${answer}`;
}
