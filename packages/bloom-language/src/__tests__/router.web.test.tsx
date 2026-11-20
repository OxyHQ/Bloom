/** The web: the route in place (the document scrolls), Bloom's bar and PageHeader. */
import { createElement } from 'react';

import { Glyph, hosts, mount, only, quietRenderer } from './support/mount';
import { pager } from './support/bloom-router';
import { Text } from '../primitives';
import { AppLayout, layout, screen, Sheet, Stack, TabView } from '../router';

jest.mock('../router/stack', () => jest.requireActual('../router/stack.web.tsx'));
jest.mock('../router/tabs', () => jest.requireActual('../router/tabs.tsx'));
jest.mock('../router/bar', () => jest.requireActual('../router/bar.tsx'));
jest.mock('../router/screen-header', () => jest.requireActual('../router/screen-header.tsx'));
jest.mock('../platform/header-host', () => jest.requireActual('../platform/header-host.tsx'));

quietRenderer();

beforeEach(() => {
  pager.pages = [{ name: 'index', href: '/', label: 'Home', icon: Glyph, bar: true }];
  pager.activePage = 'index';
});

describe('the router on the web', () => {
  it('a stack is the route in place, under the shell with Bloom’s bar', () => {
    const App = layout(() =>
      AppLayout(Stack('(tabs)', Sheet('compose'))).primaryAction(Glyph, 'Compose', 'write'),
    );
    const r = mount(createElement(App));
    expect(only(r, 'Slot')).toBeTruthy();
    expect(only(r, 'BottomBar').props.items).toHaveLength(1);
  });

  it('the tabs route in place (Bloom’s web pager), and a screen’s header is PageHeader', () => {
    expect(only(mount(createElement(layout(() => TabView()))), 'TabPagerLayout')).toBeTruthy();
    const Page = screen(() => Text('a').title('Saved'));
    const r = mount(createElement(Page));
    expect(only(r, 'PageHeader').props.title).toBe('Saved');
    expect(hosts(r, 'StackScreen')).toHaveLength(0);
  });
});
