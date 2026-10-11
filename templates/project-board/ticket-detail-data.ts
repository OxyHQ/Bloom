import { PROJECT_MEMBERS } from './project-board-data';
import type { ProjectTicket, TicketSubtask } from '../../src/project-board';

type TicketBrief = { description: string; tasks: string[]; note: string };

/** Demo briefs belong to this template, not the shared component library. */
const BRIEFS: Record<string, TicketBrief> = {
  'DS-38': {
    description:
      'Give people a clear moment to review an agent’s work before it takes action. Explore an approval card that explains what will happen, which resources are involved, and what the user can change.\n\nDesign the approve, request changes, and declined states. The card should remain readable in a busy conversation and make the next step obvious without interrupting the flow.',
    tasks: [
      'Explore compact and expanded approval cards',
      'Design approval and revision states',
      'Review keyboard and screen-reader behavior',
    ],
    note: 'The initial direction is a compact summary with an expandable action preview. Let’s validate the language before refining the visual states.',
  },
  'FE-86': {
    description:
      'Let teams save a useful combination of project, assignee, and priority filters as a named board view. A saved view should bring someone back to the same working context without rebuilding filters every morning.\n\nKeep personal views separate from team views, show when a view has unsaved changes, and handle empty results with a clear way to reset filters.',
    tasks: [
      'Build the saved-view picker',
      'Restore filters when switching views',
      'Handle empty and unsaved states',
    ],
    note: 'The view model is outlined. Personal views will be the first milestone, with shared team views following the same interaction.',
  },
  'BE-23': {
    description:
      'Create a reliable activity record for actions performed by agents. Each event should identify the actor, the affected resource, the outcome, and the time it happened.\n\nStore a correlation identifier so a sequence of related actions can be reconstructed. Exclude credentials and sensitive payloads, and keep the event schema versioned for future integrations.',
    tasks: [
      'Define the versioned event schema',
      'Add idempotent event ingestion',
      'Cover redaction and retry behavior',
    ],
    note: 'We have agreed on the event envelope. The next step is to check how retries are represented without producing duplicate activity.',
  },
  'DS-34': {
    description:
      'Define a consistent surface hierarchy for cards, menus, and floating panels. The new semantic tokens should make elevation feel intentional while preserving the quiet, neutral character of Bloom.\n\nReview light and dark modes together. Document which surface, border, and shadow combination to use at each level so consumers can build new layouts without introducing one-off colors.',
    tasks: [
      'Audit existing floating surfaces',
      'Map light and dark semantic tokens',
      'Document usage with component examples',
    ],
    note: 'The surface audit is ready. Menus and dialogs need a little more separation in dark mode; token comparisons are the next step.',
  },
  'FE-82': {
    description:
      'Make every model in the composer’s picker reachable without a mouse. Arrow keys should move through available models, Enter should confirm a selection, and Escape should return focus to the trigger.\n\nPreserve search input behavior, skip disabled models, and announce the active option and current selection to assistive technology.',
    tasks: [
      'Implement roving option focus',
      'Restore focus after selection or dismissal',
      'Verify search and disabled options',
    ],
    note: 'The interaction checklist is ready. We’ll use the existing selection primitives so focus behavior stays consistent with other menus.',
  },
  'BE-19': {
    description:
      'Expose rolling usage limits with an accurate reset timestamp so interfaces can explain when capacity becomes available again. Return used, remaining, and total values for every applicable window.\n\nUse a stable timestamp format and handle overlapping windows, delayed updates, and exhausted limits. Consumers should not need to guess which limit is blocking a request.',
    tasks: [
      'Define the usage-window response',
      'Calculate reset timestamps consistently',
      'Test overlapping and exhausted windows',
    ],
    note: 'The response shape has been reviewed. Boundary cases around window resets will be covered before the endpoint is connected to the UI.',
  },
  'FE-79': {
    description:
      'Help people follow an agent’s work as nested task groups arrive in a stream. New groups should expand naturally, completed steps should settle quietly, and the current action should remain easy to find.\n\nKeep the layout stable when several updates arrive together. Respect reduced-motion preferences and avoid moving the reader away from the section they are inspecting.',
    tasks: [
      'Animate incoming nested groups',
      'Batch updates without layout jumps',
      'Verify reduced-motion and scroll behavior',
    ],
    note: 'The nested layout is working. We’re tuning the timing around rapid updates so the hierarchy stays readable while the agent is busy.',
  },
  'DS-31': {
    description:
      'Improve chart readability on dark dashboard surfaces without making the palette feel oversaturated. Review series colors, grid lines, labels, and hover states as a complete system.\n\nCheck overlapping areas and dense legends in particular. The final choices should use existing semantic chart tokens and remain distinguishable when several series are shown together.',
    tasks: [
      'Audit dark chart surfaces and labels',
      'Tune series and hover contrast',
      'Review all Pro chart variants',
    ],
    note: 'The first contrast pass is complete. Overlapping area fills still need a final check against the quieter grid and axis labels.',
  },
  'FE-76': {
    description:
      'Make the transition between planning questions feel continuous. Preserve the user’s answers, keep the active question in view, and give the next set of choices enough breathing room to be understood.\n\nForward and backward navigation should feel equally natural. Support long answers, validation messages, and reduced motion without abrupt height changes.',
    tasks: [
      'Polish forward and back transitions',
      'Preserve answers and focus',
      'Review long answers and validation',
    ],
    note: 'The implementation is ready for review. Please check the backward transition and confirm that focus lands on the next question heading.',
  },
  'DS-27': {
    description:
      'Ship a compact avatar group for tickets and activity cards. Overlapping portraits should retain clear edges, predictable stacking, and accessible names for every person represented.\n\nInclude an overflow count for larger groups and initials when an image is unavailable. Keep sizing aligned with existing Avatar components.',
    tasks: [
      'Define overlap and overflow behavior',
      'Implement image and initials fallbacks',
      'Verify accessible group labels',
    ],
    note: 'Avatar groups are shipped and checked in both themes. The shared component now covers compact cards and larger team summaries.',
  },
  'FE-71': {
    description:
      'Keep generated screens aligned to the Studio canvas while people zoom and pan. Screen bounds, selection outlines, and labels should all follow the same coordinate system.\n\nAvoid rounding drift at fractional zoom levels and preserve the point under the cursor when zooming. Large generated layouts should remain easy to navigate.',
    tasks: [
      'Unify canvas coordinate transforms',
      'Keep cursor position stable during zoom',
      'Verify fractional zoom and large layouts',
    ],
    note: 'The coordinate fix is complete. Screens and selection outlines remain aligned across the supported zoom range.',
  },
  'BE-16': {
    description:
      'Validate template dependencies before a release is packaged. Every imported file must resolve, shared registry dependencies must be declared, and paid sources must stay out of the public registry.\n\nReport actionable build errors with the importing file and missing dependency. Verify both the CLI payload and the downloadable template package.',
    tasks: [
      'Walk template import dependencies',
      'Reject missing or leaked sources',
      'Validate generated CLI and ZIP packages',
    ],
    note: 'Dependency validation is now part of packaging. Both the registry output and template archives pass the release checks.',
  },
  'DS-25': {
    description:
      'Document how animated blocks behave when reduced motion is enabled. Explain which transitions are removed, which state changes remain visible, and how focus communicates progress.\n\nInclude practical examples for streaming tasks, draggable cards, and dialogs. The guidance should help teams preserve clarity without relying on movement.',
    tasks: [
      'Audit motion across interactive blocks',
      'Write reduced-motion alternatives',
      'Publish examples and review guidance',
    ],
    note: 'The guidance is published with examples for the main interactive blocks. Each pattern includes a reduced-motion alternative.',
  },
};

export function ticketBrief(ticket: ProjectTicket): TicketBrief {
  return (
    BRIEFS[ticket.code] ?? {
      description: `Plan and deliver ${ticket.title.toLowerCase()} for ${ticket.project}. Capture the expected behavior, implement the change, and review it with the team before moving it to Done.`,
      tasks: [
        'Confirm the scope and acceptance criteria',
        'Implement and review the change',
        'Verify the final experience',
      ],
      note: 'This ticket is ready to be scoped. Add any context the team needs before starting work.',
    }
  );
}

export function ticketSubtasks(ticket: ProjectTicket, columnId: string): TicketSubtask[] {
  const count = { backlog: 0, todo: 0, 'in-progress': 1, review: 2, done: 3 }[columnId] ?? 0;
  return (
    ticket.subtasks ??
    ticketBrief(ticket).tasks.map((title, i) => ({
      id: `${ticket.id}-task-${i}`,
      title,
      done: i < count,
    }))
  );
}

/** Stable demo variation: opening or editing a ticket must not reshuffle its history. */
export function ticketDemoActivity(ticket: ProjectTicket) {
  let seed = Array.from(ticket.id).reduce(
    (hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0,
    2166136261,
  );
  seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0;
  seed = (seed ^ (seed >>> 16)) >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const members = Object.values(PROJECT_MEMBERS);
  const count = 1 + Math.floor(random() * 3);
  const firstAuthor = Math.floor(random() * members.length);
  const brief = ticketBrief(ticket);
  const messages = [
    brief.note,
    `I’ll take a look at this with the ${ticket.project} team and share feedback here.`,
    'Please check the final interaction with keyboard navigation too.',
    'The scope looks good. Let’s review the first pass together before moving ahead.',
    'I’ve added this to our next review. Let me know if anything is blocking progress.',
  ];
  const messageOffset = Math.floor(random() * messages.length);
  const comments = Array.from({ length: count }, (_, index) => ({
    id: `${ticket.id}-discussion-${index}`,
    author: members[(firstAuthor + index) % members.length]!.name,
    body: messages[(messageOffset + index) % messages.length]!,
    time: ['2 hours ago', '5 hours ago', 'Yesterday'][index]!,
  }));
  const variant = random() < 0.35 ? ('bar' as const) : ('area' as const);
  const intensity = 3 + random() * 22;
  const series = Array.from({ length: 16 }, (_, day) => ({
    label: `Sep ${day + 1}`,
    value: random() < 0.2 ? 0 : Math.round(random() * intensity * 10) / 10,
  }));
  // Keep a visible two-day idle stretch in every ticket's dashed baseline.
  // Derive its position without advancing the generator used by resource links.
  const idleStart = 1 + (seed % (series.length - 3));
  series[idleStart]!.value = 0;
  series[idleStart + 1]!.value = 0;
  const total = Math.round(series.reduce((sum, point) => sum + point.value, 0) * 10) / 10;
  const previous = series.slice(0, 8).reduce((sum, point) => sum + point.value, 0);
  const recent = series.slice(8).reduce((sum, point) => sum + point.value, 0);
  const percentage = previous ? ((recent - previous) / previous) * 100 : 0;
  const resourcePool = ticket.code.startsWith('DS-')
    ? [
        { label: 'figma.com', href: 'https://www.figma.com' },
        {
          label: 'tailwindcss.com',
          href: 'https://tailwindcss.com/docs/theme',
        },
        { label: 'remixicon.com', href: 'https://remixicon.com' },
        { label: 'w3.org', href: 'https://www.w3.org/WAI/' },
      ]
    : ticket.code.startsWith('BE-')
      ? [
          { label: 'nodejs.org', href: 'https://nodejs.org/docs/latest/api/' },
          { label: 'postgresql.org', href: 'https://www.postgresql.org/docs/' },
          { label: 'opentelemetry.io', href: 'https://opentelemetry.io/docs/' },
          {
            label: 'developer.mozilla.org',
            href: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',
          },
        ]
      : [
          { label: 'react.dev', href: 'https://react.dev/learn' },
          {
            label: 'react-aria.adobe.com',
            href: 'https://react-aria.adobe.com/',
          },
          {
            label: 'developer.mozilla.org',
            href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility',
          },
          { label: 'motion.dev', href: 'https://motion.dev/docs/react' },
        ];
  const resourceOffset = Math.floor(random() * resourcePool.length);
  const resources = Array.from(
    { length: 1 + Math.floor(random() * 3) },
    (_, index) => resourcePool[(resourceOffset + index) % resourcePool.length]!,
  );
  return {
    comments,
    resources,
    series,
    total,
    variant,
    change: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`,
  };
}
