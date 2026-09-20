import type { AiChatGeneration } from '../../src/ai-chat';
import type { ComposerStatusBarFolder, ModelPickerModel } from '../../src/composer-panel';
import {
  RiAddFill,
  RiCustomerServiceLine,
  RiGuideLine,
  RiRobot2Line,
  RiSettings4Line,
} from '../../src/icons/remix';
import type { SidebarAccount, SidebarNavItem, SidebarPlan, SidebarTree } from '../../src/sidebar';

import beachKid from './assets/gallery/beach-kid.webp';
import bikerRest from './assets/gallery/biker-rest.webp';
import bloomSwirl from './assets/gallery/bloom-swirl.webp';
import catWithBeer from './assets/gallery/cat-with-beer.webp';
import cloudCrown from './assets/gallery/cloud-crown.webp';
import girlsAndBlooms from './assets/gallery/girls-and-blooms.webp';
import goldfishLivingRoom from './assets/gallery/goldfish-living-room.webp';
import greenApe from './assets/gallery/green-ape.webp';
import hanokBookshop from './assets/gallery/hanok-bookshop.webp';
import helmetPortraits from './assets/gallery/helmet-portraits.webp';
import hoopoes from './assets/gallery/hoopoes.webp';
import linenCampaign from './assets/gallery/linen-campaign.webp';
import massiveBox from './assets/gallery/massive-box.webp';
import nairobiVibes from './assets/gallery/nairobi-vibes.webp';
import perfumeStillLife from './assets/gallery/perfume-still-life.webp';
import racingSuit from './assets/gallery/racing-suit.webp';
import readerPink from './assets/gallery/reader-pink.webp';
import roninRed from './assets/gallery/ronin-red.webp';
import underwaterHighway from './assets/gallery/underwater-highway.webp';
import yellowCabs from './assets/gallery/yellow-cabs.webp';
import generatedFootballer from './assets/generated-footballer.jpg';

/** The three threads the template scripts. */
export type AiChatScenario = 'landing-page-design' | 'image-generation' | 'coding-scenario';

export const SCENARIOS: ReadonlyArray<AiChatScenario> = ['landing-page-design', 'image-generation', 'coding-scenario'];

export const NAV_ITEMS: SidebarNavItem[] = [
  { key: 'new-agent', label: 'New agent', icon: RiAddFill },
  { key: 'automations', label: 'Automations', icon: RiRobot2Line },
  { key: 'customize', label: 'Customize', icon: RiGuideLine },
];

export const SECONDARY_ITEMS = (openSettings: () => void): SidebarNavItem[] => [
  { key: 'support', label: 'Support', icon: RiCustomerServiceLine },
  { key: 'settings', label: 'Settings', icon: RiSettings4Line, onPress: openSettings },
];

export const ACCOUNT: SidebarAccount = {
  name: 'Maya Collins',
  avatar: { initials: 'M', color: 'neutral' },
  users: [
    { id: 'm', name: 'Maya Collins', avatar: { initials: 'M', color: 'neutral' }, selected: true },
    { id: 's', name: 'Sam Rivera', avatar: { initials: 'S', color: 'lime' } },
    { id: 'l', name: 'Lena Park', avatar: { initials: 'L', color: 'pink' } },
  ],
  onAddUser: () => {},
  onManage: () => {},
};

export const REPOSITORIES: SidebarTree = {
  label: 'Repositories',
  folders: [
    {
      key: 'bloom',
      label: 'bloom',
      items: [
        { key: 'pro-badge', label: 'pro badge restyle', meta: '2h' },
        { key: 'installation-docs', label: 'installation docs page', meta: '1d' },
      ],
    },
    {
      key: 'vibl',
      label: 'vibl coding project',
      defaultOpen: true,
      items: [
        { key: 'landing-page-design', label: 'landing page design', meta: '34m' },
        { key: 'image-generation', label: 'image generation', meta: 'now' },
        { key: 'coding-scenario', label: 'coding scenario', meta: 'now' },
        { key: 'mobile-app', label: 'mobile app for vuejs...', meta: '5h' },
        { key: 'code-refactor', label: 'code refactor dropdo...', meta: '18h' },
      ],
    },
    {
      key: 'studio',
      label: 'studio landing page work',
      items: [
        { key: 'hero-animation', label: 'hero section animation', meta: '3d' },
        { key: 'pricing-copy', label: 'pricing table copy', meta: '4d' },
      ],
    },
    {
      key: 'pirate',
      label: 'pirate mini game iOS',
      items: [
        { key: 'cannon-physics', label: 'cannon physics tuning', meta: '1w' },
        { key: 'sprite-sheet', label: 'sprite sheet cleanup', meta: '2w' },
      ],
    },
  ],
};

export const PLAN: SidebarPlan = {
  name: 'Design team',
  plan: 'Pro Plan',
  avatar: { initials: 'B', color: 'blue' },
  actionLabel: 'Upgrade',
};

/**
 * `{ id, name }` entries, the form to copy: the pill keys, matches and reports
 * the routing id and only ever DRAWS the name. A bare string list still works
 * and is shorthand for an id that happens to be its own label.
 */
export const MODELS: ReadonlyArray<ModelPickerModel> = [
  { id: 'vibl/composer-2.5', name: 'Composer 2.5' },
  { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol' },
  { id: 'oxy/fable-5', name: 'Fable 5' },
  { id: 'anthropic/sonnet-5', name: 'Sonnet 5' },
];

export const LOCAL_FOLDERS: ComposerStatusBarFolder[] = [
  { prefix: 'users/maya/', name: 'project-sea' },
  { prefix: 'users/desktop/', name: 'vibl' },
  { prefix: 'users/documents/', name: 'bloom' },
];

/** The file open in the code panel. */
export const PANEL_CODE: string = "import type { Metadata } from \"next\";\nimport { DashboardShell } from \"@/components/dashboard/dashboard-shell\";\n\nexport const metadata: Metadata = {\n  title: \"Home Dashboard Template\",\n  description:\n    \"An admin dashboard screen: sidebar navigation, KPI cards, a bar chart and a customers table.\",\n};\n\nconst PREVIEW_CODE = `<DashboardShell />`;\n\nexport default function HomeDashboardDetail() {\n  return (\n    <ComponentDetail\n      wide\n      title=\"Home Dashboard\"\n      description=\"Sidebar navigation, a header with search and notifications, KPI cards, an earnings chart and a customers table.\"\n      preview={\n        <div className=\"h-[760px] w-full overflow-hidden rounded-2xl border\">\n          <DashboardShell />\n        </div>\n      }\n      previewCode={PREVIEW_CODE}\n    />\n  );\n}";

/** The snippet in the coding reply's code card. */
export const CODING_RESPONSE_CODE = `const nextTheme = theme === "dark" ? "light" : "dark";

document.documentElement.classList.toggle(
  "dark",
  nextTheme === "dark",
);
localStorage.setItem("bloom:theme", nextTheme);`;

type Source = AiChatGeneration['source'];
const image = (asset: unknown): Source => (typeof asset === 'string' ? { uri: asset } : (asset as Source));

/** The gallery, in authoring order (`width / height` of each file). */
const GENERATIONS: AiChatGeneration[] = [
  { id: 'goldfish-living-room', prompt: 'Goldfish living room, surreal collage', source: image(goldfishLivingRoom), aspectRatio: 1120 / 2000 },
  { id: 'racing-suit', prompt: 'Racing suit editorial, metallic green', source: image(racingSuit), aspectRatio: 1120 / 2000 },
  { id: 'hoopoes', prompt: 'Hoopoes in olive branches, gouache', source: image(hoopoes), aspectRatio: 1333 / 2000 },
  { id: 'biker-rest', prompt: 'Biker resting, watercolour manga', source: image(bikerRest), aspectRatio: 1120 / 2000 },
  { id: 'helmet-portraits', prompt: 'Helmet portraits, risograph grid', source: image(helmetPortraits), aspectRatio: 1497 / 2000 },
  { id: 'cloud-crown', prompt: 'Cloud crown, editorial portrait', source: image(cloudCrown), aspectRatio: 1333 / 2000 },
  { id: 'nairobi-vibes', prompt: 'Nairobi Vibes, blackletter poster', source: image(nairobiVibes), aspectRatio: 928 / 1232 },
  { id: 'beach-kid', prompt: 'Beach kid, 35mm flash', source: image(beachKid), aspectRatio: 960 / 1200 },
  { id: 'reader-pink', prompt: 'Reader on pink, crayon texture', source: image(readerPink), aspectRatio: 1 },
  { id: 'cat-with-beer', prompt: 'Cat with a beer, bold linework', source: image(catWithBeer), aspectRatio: 928 / 1232 },
  { id: 'perfume-still-life', prompt: 'Perfume still life, grainy neon', source: image(perfumeStillLife), aspectRatio: 1120 / 2000 },
  { id: 'linen-campaign', prompt: 'Linen campaign, crimson backdrop', source: image(linenCampaign), aspectRatio: 1 },
  { id: 'girls-and-blooms', prompt: 'Girls and blooms, painterly crop', source: image(girlsAndBlooms), aspectRatio: 896 / 1344 },
  { id: 'ronin-red', prompt: 'Ronin in red, cel-shaded', source: image(roninRed), aspectRatio: 1120 / 2000 },
  { id: 'yellow-cabs', prompt: 'Yellow cabs, palette-knife oil', source: image(yellowCabs), aspectRatio: 1497 / 2000 },
  { id: 'green-ape', prompt: 'Green ape, screenprint halftone', source: image(greenApe), aspectRatio: 1 },
  { id: 'hanok-bookshop', prompt: 'Hanok bookshop, pastel duotone', source: image(hanokBookshop), aspectRatio: 928 / 1232 },
  { id: 'underwater-highway', prompt: 'Underwater highway, flat vector', source: image(underwaterHighway), aspectRatio: 1120 / 2000 },
  { id: 'massive-box', prompt: 'MASSIV3 packaging, studio mockup', source: image(massiveBox), aspectRatio: 1120 / 2000 },
  { id: 'bloom-swirl', prompt: 'Bloom swirl, impasto abstraction', source: image(bloomSwirl), aspectRatio: 1 },
];

/** A deterministic shuffle (mulberry32) so the wall looks scattered but stays stable. */
function shuffled<T>(items: T[], seed: number): T[] {
  let a = seed;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export const GALLERY_WALL = shuffled(GENERATIONS, 11);

/** The image the thread generates, mirrored into the gallery once it lands. */
export const GENERATED_IMAGE: AiChatGeneration = {
  id: 'generated-footballer',
  prompt: 'Vintage editorial Messi, Argentina kit',
  source: image(generatedFootballer),
  aspectRatio: 449 / 600,
};

export const GENERATED_IMAGE_ALT = "Vintage-style illustration of a football player in Argentina's striped kit";
