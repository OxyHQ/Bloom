/**
 * A sidebar tree's selection moving draws again only the rows it moves between (and, for a nested
 * row, the rows it nests under), never every row: an application's places sidebar (Dropsea's,
 * Finder's) has a selection that moves at every navigation, and drawing every row again there was
 * a fifth of what going back to a folder cost (OxyOS's perf-dropsea-scaled). Counted by each
 * row's icon, which its row draws whenever it renders.
 */
import { render } from '@testing-library/react-native';

import { Sidebar, type SidebarTree } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const renders = new Map<string, number>();

function drawn(key: string) {
  renders.set(key, (renders.get(key) ?? 0) + 1);
  return null;
}

// Each row's icon, which its row draws whenever it renders.
const HomeIcon = () => drawn('home');
const DocumentsIcon = () => drawn('documents');
const DownloadsIcon = () => drawn('downloads');
const ProjectsIcon = () => drawn('projects');
const AtlasIcon = () => drawn('atlas');
const DropseaIcon = () => drawn('dropsea');
const TrashIcon = () => drawn('trash');

// The tree as an application keeps it: the same objects for as long as what it shows is the same.
const TREE: SidebarTree[] = [
  {
    key: 'places',
    label: 'Favourites',
    items: [
      { key: 'home', label: 'Home', icon: HomeIcon },
      { key: 'documents', label: 'Documents', icon: DocumentsIcon },
      { key: 'downloads', label: 'Downloads', icon: DownloadsIcon },
      {
        key: 'projects',
        label: 'Projects',
        icon: ProjectsIcon,
        defaultOpen: true,
        items: [
          { key: 'atlas', label: 'Atlas', icon: AtlasIcon },
          { key: 'dropsea', label: 'Dropsea', icon: DropseaIcon },
        ],
      },
    ],
  },
  {
    key: 'locations',
    label: 'Locations',
    items: [{ key: 'trash', label: 'Trash', icon: TrashIcon }],
  },
];

const onTreeItemPress = jest.fn();

function sidebar(selected: string) {
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Sidebar
        tree={TREE}
        selectedTreeItem={selected}
        onTreeItemPress={onTreeItemPress}
        showThemeToggle={false}
      />
    </BloomThemeProvider>
  );
}

/** The rows drawn again by `rerender`, by key. */
function drawnAgain(rerender: () => void): string[] {
  const before = new Map(renders);
  rerender();
  return [...renders.keys()].filter((key) => renders.get(key) !== before.get(key)).sort();
}

beforeEach(() => renders.clear());

describe('Sidebar tree selection', () => {
  it('draws again only the two rows the selection moves between', () => {
    const screen = render(sidebar('downloads'));
    expect(drawnAgain(() => screen.rerender(sidebar('home')))).toEqual(['downloads', 'home']);
    expect(drawnAgain(() => screen.rerender(sidebar('trash')))).toEqual(['home', 'trash']);
  });

  it('draws, for a nested row, only the branch it is in and the row it leaves', () => {
    const screen = render(sidebar('home'));
    // The branch's own rows may draw with the row they nest under; no row outside it does.
    const intoBranch = drawnAgain(() => screen.rerender(sidebar('dropsea')));
    expect(intoBranch).toEqual(expect.arrayContaining(['dropsea', 'home', 'projects']));
    expect(
      intoBranch.filter((key) => !['atlas', 'dropsea', 'home', 'projects'].includes(key)),
    ).toEqual([]);
    const outOfBranch = drawnAgain(() => screen.rerender(sidebar('trash')));
    expect(outOfBranch).toEqual(expect.arrayContaining(['dropsea', 'projects', 'trash']));
    expect(outOfBranch).not.toEqual(expect.arrayContaining(['home']));
    expect(
      outOfBranch.filter((key) => !['atlas', 'dropsea', 'projects', 'trash'].includes(key)),
    ).toEqual([]);
  });

  it('draws nothing when the selection stays', () => {
    const screen = render(sidebar('documents'));
    expect(drawnAgain(() => screen.rerender(sidebar('documents')))).toEqual([]);
  });
});
