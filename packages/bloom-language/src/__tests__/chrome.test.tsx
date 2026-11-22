/**
 * The app chrome's hosts hand Bloom's components the data and props an app
 * writes by hand: the sidebar's rows, the rail's items, the page footer's
 * actions. What each draws is the parity suite's (`parity/navigation.cases.tsx`).
 */
import { Glyph, hosts, mount, only, OtherGlyph, quietRenderer } from './support/mount';
import {
  Command,
  CommandGroup,
  CommandItem,
  Icon,
  NavItem,
  PageFooter,
  Rail,
  RailItem,
  SettingsGroup,
  SettingsItem,
  SettingsModal,
  HStack,
  Sidebar,
  SidebarMode,
  StickySection,
  Text,
  Toolbar,
  ScrollArea,
  ScrollSurface,
  AutoHideBar,
  ResizeHandle,
  TreeFolder,
  TreeItem,
  TreeSection,
} from '../primitives';
import {
  SettingsDateField,
  SettingsSection,
  SettingsSelect,
  SettingsTextField,
  SettingsValue,
} from '../controls/settings';
import { toElement } from '../render';

quietRenderer();

describe('Sidebar is Bloom’s Sidebar', () => {
  it('its modes, team, plan, onboarding card and query are Bloom’s', () => {
    const choose = jest.fn();
    const typed = jest.fn();
    const team = { name: 'Acme', email: 'team@acme.dev' };
    const plan = { name: 'Ana', plan: 'Pro Plan', actionLabel: 'Upgrade' };
    const r = mount(
      toElement(
        Sidebar(
          SidebarMode('Search', Glyph).id('search').shortcut('⌥⌃1'),
          SidebarMode('Computer', OtherGlyph),
          NavItem('Home', Glyph),
        )
          .mode('search')
          .onModeChange(choose)
          .modePresentation('toggle')
          .modesLabel('Mode')
          .team(team)
          .teamPlacement('header')
          .plan(plan)
          .onboarding({
            title: 'Get started',
            leading: Text('O'),
            steps: [{ key: 'invite', label: 'Invite your team' }],
            visibleCount: 1,
          })
          .query('road', typed),
      ),
    );
    const props = only(r, 'Sidebar').props;
    expect(props).toMatchObject({
      modes: [
        { key: 'search', label: 'Search', icon: Glyph, shortcut: '⌥⌃1' },
        { key: 'Computer', label: 'Computer', icon: OtherGlyph },
      ],
      mode: 'search',
      onModeChange: choose,
      modesPresentation: 'toggle',
      modesLabel: 'Mode',
      team,
      teamPlacement: 'header',
      plan,
      searchQuery: 'road',
      onSearchQueryChange: typed,
    });
    expect(props.items).toHaveLength(1);
    expect(props.onboarding).toMatchObject({
      title: 'Get started',
      steps: [{ key: 'invite', label: 'Invite your team' }],
      visibleCount: 1,
    });
    expect(props.onboarding.leading).toBeTruthy();
  });

  it('a draggable tree row’s drop is told by id; its drop rules are Bloom’s', () => {
    const dropped = jest.fn();
    const r = mount(
      toElement(
        Sidebar(
          TreeSection(
            'Private',
            TreeItem('Roadmap').id('roadmap').draggable().droppable(false).dropBeside(false),
          ).id('private'),
          TreeSection('Shared').droppable(false),
        ).onDrop(dropped),
      ),
    );
    const props = only(r, 'Sidebar').props;
    expect(props.tree[0].items[0]).toMatchObject({
      key: 'roadmap',
      draggable: true,
      droppable: false,
      dropBeside: false,
    });
    expect(props.tree[1]).toMatchObject({ label: 'Shared', droppable: false });
    const roadmap = props.tree[0].items[0];
    props.onTreeItemDrop({
      item: roadmap,
      from: props.tree[0],
      target: roadmap,
      position: 'after',
      section: props.tree[1],
    });
    expect(dropped).toHaveBeenCalledWith({
      id: 'roadmap',
      from: 'private',
      target: 'roadmap',
      position: 'after',
      section: 'Shared',
    });
    expect('onTreeItemDrop' in only(mount(toElement(Sidebar())), 'Sidebar').props).toBe(false);
  });

  it('destinations are its items, secondary ones its foot; a tree section is its tree', () => {
    const r = mount(
      toElement(
        Sidebar(
          NavItem('Home', Glyph).id('home').link('/'),
          NavItem('Settings', OtherGlyph).secondary(),
          TreeSection(
            'Projects',
            TreeFolder('Archive', TreeItem('Old')),
            TreeItem('Roadmap', TreeItem('Q1').id('q1')).id('roadmap'),
          ),
        ).selection('q1'),
      ),
    );
    const props = only(r, 'Sidebar').props;
    expect(props.items).toEqual([{ key: 'home', label: 'Home', icon: Glyph, href: '/' }]);
    expect(props.secondaryItems).toEqual([
      { key: 'Settings', label: 'Settings', icon: OtherGlyph },
    ]);
    expect(props.tree).toEqual([
      {
        label: 'Projects',
        items: [{ key: 'roadmap', label: 'Roadmap', items: [{ key: 'q1', label: 'Q1' }] }],
        folders: [{ key: 'Archive', label: 'Archive', items: [{ key: 'Old', label: 'Old' }] }],
      },
    ]);
    expect(props).toMatchObject({ selected: 'q1', selectedTreeItem: 'q1' });
    // Nothing the chain left out reaches it.
    expect('showSearch' in props).toBe(false);
    expect('onNavigate' in props).toBe(false);
  });

  it('onSelect hears a tree row and a linking destination by id', () => {
    const select = jest.fn();
    const r = mount(toElement(Sidebar(TreeSection('A', TreeItem('B').id('b'))).onSelect(select)));
    const props = only(r, 'Sidebar').props;
    props.onTreeItemPress({ key: 'b', label: 'B' });
    props.onNavigate({ key: 'home', label: 'Home', icon: Glyph, href: '/' });
    expect(select.mock.calls).toEqual([['b'], ['home']]);
  });
});

describe('Rail and PageFooter', () => {
  it('a rail’s items carry the glyph views the app gave them', () => {
    const select = jest.fn();
    const r = mount(
      toElement(
        Rail(RailItem('Home', Icon(Glyph)).id('home').activeIcon(Icon(OtherGlyph)))
          .selection('home')
          .onSelect(select)
          .width('96'),
      ),
    );
    const props = only(r, 'Rail').props;
    expect(props).toMatchObject({ activeId: 'home', onSelect: select, width: 96 });
    expect(props.items).toHaveLength(1);
    expect(props.items[0]).toMatchObject({ id: 'home', label: 'Home' });
    expect(props.items[0].activeIcon).toBeTruthy();
    expect(hosts(r, 'Glyph')).toHaveLength(1);
  });

  it('a page footer’s children come before its actions; its scrim and safe area are its own', () => {
    const r = mount(
      toElement(
        PageFooter(Text('2 selected'))
          .toolbar(Text('Delete'))
          .pinning('sticky')
          .scrollEdge('auto')
          .ignoresSafeArea(),
      ),
    );
    const footer = only(r, 'PageFooter');
    expect(footer.props).toMatchObject({ position: 'sticky', scrim: 'auto', safeArea: false });
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['2 selected', 'Delete']);
  });
});

describe('Command and SettingsModal', () => {
  it('a palette’s items are its rows, ungrouped first, each group’s under its title', () => {
    const compose = jest.fn();
    const change = jest.fn();
    const query = jest.fn();
    const r = mount(
      toElement(
        Command(
          CommandItem('New post')
            .icon(Glyph)
            .shortcut('⌘N')
            .keywords('write', 'compose')
            .onPress(compose),
          CommandGroup('Go to', CommandItem('Settings').id('settings').subtitle('Preferences')),
        )
          .presented([true, change])
          .placeholder('Search')
          .emptyLabel('Nothing')
          .query('ne', query),
      ),
    );
    const props = only(r, 'Command').props;
    expect(props).toMatchObject({
      open: true,
      onOpenChange: change,
      placeholder: 'Search',
      emptyText: 'Nothing',
      query: 'ne',
      onQueryChange: query,
    });
    expect(props.items).toEqual([
      {
        id: 'New post',
        label: 'New post',
        icon: Glyph,
        keywords: ['write', 'compose'],
        shortcut: '⌘N',
        onSelect: expect.any(Function),
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Preferences',
        group: 'Go to',
        onSelect: expect.any(Function),
      },
    ]);
    props.items[0].onSelect();
    expect(compose).toHaveBeenCalledTimes(1);
  });

  it('settings: groups of rows, a row with content opens its page, built only when shown', () => {
    const profile = jest.fn(() => Text('profile'));
    const signOut = jest.fn();
    const change = jest.fn();
    const r = mount(
      toElement(
        SettingsModal(
          SettingsGroup(
            'Account',
            SettingsItem('Profile', Glyph).id('profile').content(profile).fullBleed(),
            SettingsItem('Sign out', OtherGlyph).onPress(signOut),
          ),
        )
          .presented([true, change])
          .selection('profile')
          .initialView('page')
          .presentation('floating'),
      ),
    );
    const props = only(r, 'SettingsModal').props;
    expect(props.groups).toEqual([
      {
        label: 'Account',
        items: [
          { key: 'profile', label: 'Profile', icon: Glyph, page: 'profile' },
          { key: 'Sign out', label: 'Sign out', icon: OtherGlyph, onPress: expect.any(Function) },
        ],
      },
    ]);
    expect(props).toMatchObject({
      open: true,
      page: 'profile',
      initialView: 'page',
      headerPresentation: 'floating',
    });
    expect(props.pages.profile).toMatchObject({ title: 'Profile', fullBleed: true });
    expect(profile).not.toHaveBeenCalled();
    props.pages.profile.content();
    expect(profile).toHaveBeenCalledTimes(1);
    props.onClose();
    expect(change).toHaveBeenCalledWith(false);
  });
});

describe('the layout family', () => {
  it('a toolbar’s tools come before its actions and accessory', () => {
    const r = mount(
      toElement(
        Toolbar(Text('bold'), Text('italic'))
          .trailing(Text('share'))
          .accessory(Text('fonts'))
          .size('sm')
          .testID('tools'),
      ),
    );
    expect(only(r, 'Toolbar').props).toMatchObject({ size: 'sm', testID: 'tools' });
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual([
      'bold',
      'italic',
      'share',
      'fonts',
    ]);
    expect('size' in only(mount(toElement(Toolbar())), 'Toolbar').props).toBe(false);
  });

  it('a sticky section holds its children', () => {
    const r = mount(toElement(StickySection(Text('Today')).testID('day')));
    expect(only(r, 'StickySection').props.testID).toBe('day');
    expect(hosts(r, 'Text')).toHaveLength(1);
  });

  it('a scroll area is Bloom’s ScrollArea: its margins, gap, axis, bar and keyboard', () => {
    const r = mount(
      toElement(
        ScrollArea(Text('a'), Text('b'))
          .contentMargins('horizontal', 'lg')
          .spacing('sm')
          .axis('horizontal')
          .scrollbar('hover')
          .scrollbarSide('start')
          .size('md')
          .scrollDismissesKeyboard('interactively')
          .keyboardTaps('always')
          .testID('area'),
      ),
    );
    expect(only(r, 'ScrollArea').props).toMatchObject({
      contentContainerStyle: { paddingHorizontal: 16, gap: 8 },
      horizontal: true,
      scrollbar: 'hover',
      scrollbarSide: 'start',
      size: 'md',
      keyboardDismissMode: 'interactive',
      keyboardShouldPersistTaps: 'always',
      testID: 'area',
    });
    expect(hosts(r, 'Text')).toHaveLength(2);
    // What the chain leaves out is not there: Bloom's defaults hold.
    const bare = only(mount(toElement(ScrollArea())), 'ScrollArea').props;
    expect(Object.keys(bare).filter((name) => name !== 'children')).toEqual([]);
  });

  it('a scroll surface keeps its sticky chrome, fade and surface', () => {
    const r = mount(
      toElement(
        ScrollSurface(Text('body'))
          .stickyHeader(Text('head'))
          .stickyFooter(Text('foot'))
          .fadeHeight('lg')
          .fadeBottom(false)
          .matchSurfacePaint()
          .style('secondary')
          .label('Messages'),
      ),
    );
    expect(only(r, 'ScrollSurface').props).toMatchObject({
      fadeHeight: 16,
      fadeBottom: false,
      matchSurfacePaint: true,
      surface: 'secondary',
      label: 'Messages',
    });
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['head', 'body', 'foot']);
  });

  it('an auto-hiding bar draws its bar over its body, collapsed as its owner says', () => {
    const reveal = jest.fn();
    const r = mount(
      toElement(
        AutoHideBar(Text('bar'), Text('body'))
          .summary('oxy.so')
          .collapsed()
          .onReveal(reveal)
          .peek(false)
          .barHeight('44')
          .collapsedHeight('xl')
          .label('Show the toolbar')
          .testID('chrome'),
      ),
    );
    expect(only(r, 'AutoHideBar').props).toMatchObject({
      summary: 'oxy.so',
      collapsed: true,
      onReveal: reveal,
      peek: false,
      height: 44,
      collapsedHeight: 20,
      revealLabel: 'Show the toolbar',
      testID: 'chrome',
    });
    expect(hosts(r, 'Text').map((t) => t.props.children)).toEqual(['bar', 'body']);
    expect(only(mount(toElement(AutoHideBar(Text('bar')))), 'AutoHideBar').props.collapsed).toBe(
      false,
    );
  });

  it('a resize handle reports its drag', () => {
    const resize = jest.fn();
    const r = mount(
      toElement(
        ResizeHandle(resize)
          .axis('horizontal')
          .style('pill')
          .thickness('14')
          .label('Resize the list')
          .testID('edge'),
      ),
    );
    expect(only(r, 'ResizeHandle').props).toMatchObject({
      onResize: resize,
      orientation: 'horizontal',
      variant: 'pill',
      thickness: 14,
      label: 'Resize the list',
      testID: 'edge',
    });
  });
});

describe('the settings pages’ rows', () => {
  it('a section holds its rows under its label, with its description, action and inset', () => {
    const r = mount(
      toElement(
        SettingsSection('Notifications', SettingsValue('On'), SettingsValue('Weekly'))
          .description('How we reach you')
          .trailing(Text('Manage'))
          .inset('sm')
          .testID('notify'),
      ),
    );
    expect(only(r, 'SettingsSection').props).toMatchObject({
      label: 'Notifications',
      description: 'How we reach you',
      inset: 8,
      testID: 'notify',
    });
    expect(only(r, 'SettingsSection').props.action).toBeTruthy();
    expect(hosts(r, 'SettingsValueField').map((v) => v.props.children)).toEqual(['On', 'Weekly']);
    expect(
      'label' in only(mount(toElement(SettingsSection(undefined))), 'SettingsSection').props,
    ).toBe(false);
  });

  it('a value takes its glyph and muted ink', () => {
    const r = mount(toElement(SettingsValue('a1b2').icon(Glyph).muted()));
    expect(only(r, 'SettingsValueField').props).toMatchObject({ icon: Glyph, muted: true });
  });

  it('a select reads and writes its binding, its choices Bloom’s items', () => {
    const set = jest.fn();
    const items = [
      { value: 'always', label: 'Always' },
      { value: 'never', label: 'Never' },
    ] as const;
    const r = mount(
      toElement(
        SettingsSelect('Autoplay', ['always', set], items)
          .compact(false)
          .size('sm')
          .disabled()
          .width('200'),
      ),
    );
    const props = only(r, 'SettingsSelect').props;
    expect(props).toMatchObject({
      label: 'Autoplay',
      value: 'always',
      onChange: set,
      items,
      compact: false,
      size: 'sm',
      disabled: true,
      width: 200,
    });
  });

  it('a text field commits into its binding; a date field changes its own', () => {
    const commit = jest.fn();
    const change = jest.fn();
    const born = new Date(1997, 6, 28);
    const format = (date: Date) => date.toISOString();
    const r = mount(
      toElement(
        HStack(
          SettingsTextField('Email', ['ana@oxy.so', commit])
            .icon(Glyph)
            .placeholder('you@example.com')
            .keyboard('email-address')
            .contentType('email')
            .savedToast(false)
            .testID('email'),
          SettingsDateField('Birthday', [born, change])
            .minDate(new Date(1900, 0, 1))
            .maxDate(new Date(2020, 0, 1))
            .dateFormat(format)
            .testID('born'),
        ),
      ),
    );
    expect(only(r, 'SettingsTextField').props).toMatchObject({
      label: 'Email',
      value: 'ana@oxy.so',
      onCommit: commit,
      icon: Glyph,
      placeholder: 'you@example.com',
      keyboardType: 'email-address',
      autoComplete: 'email',
      showSavedToast: false,
      testID: 'email',
    });
    expect(only(r, 'SettingsDateField').props).toMatchObject({
      label: 'Birthday',
      value: born,
      onChange: change,
      formatDate: format,
      testID: 'born',
    });
  });
});
