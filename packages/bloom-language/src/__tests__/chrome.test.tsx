/**
 * The app chrome's hosts hand Bloom's components the data and props an app
 * writes by hand: the sidebar's rows, the rail's items, the page footer's
 * actions. What each draws is the parity suite's (`parity/navigation.cases.tsx`).
 */
import { Glyph, hosts, mount, only, OtherGlyph, quietRenderer } from './support/mount';
import {
  Icon,
  NavItem,
  PageFooter,
  Rail,
  RailItem,
  Sidebar,
  Text,
  TreeFolder,
  TreeItem,
  TreeSection,
} from '../primitives';
import { toElement } from '../render';

quietRenderer();

describe('Sidebar is Bloom’s Sidebar', () => {
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
