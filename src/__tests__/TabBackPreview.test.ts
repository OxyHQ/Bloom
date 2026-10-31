import { tabBackPreview, type BackPreviewState } from '../tab-pager/expo-router/back-preview';

const routes = ['home', 'camera', 'search', 'profile'].map((name) => ({ key: `${name}-1`, name }));
const entry = (name: string) => ({ type: 'route', key: `${name}-1` });
const state = (history: string[]): BackPreviewState => ({
  key: 'tabs-1',
  index: routes.findIndex((route) => route.name === history[history.length - 1]),
  routes,
  history: history.map(entry),
});

it('previews actual history across nonadjacent pages without consuming or focusing it', () => {
  const current = state(['home', 'profile']);
  const unchanged = structuredClone(current);
  expect(tabBackPreview(current)).toMatchObject({ from: 'profile', to: 'home' });
  expect(tabBackPreview(current)).toEqual(tabBackPreview(current));
  expect(current).toEqual(unchanged);
});

it('yields exhausted history to the parent, including a direct link to a non-home page', () => {
  expect(tabBackPreview(state(['home']))).toBeNull();
  expect(tabBackPreview(state(['profile']))).toBeNull();
  expect(tabBackPreview({ ...state(['profile']), history: undefined })).toBeNull();
});

it('changes its session when the route, navigator or history changes during a gesture', () => {
  const current = state(['home', 'search', 'profile']);
  const original = tabBackPreview(current)?.sessionKey;
  expect(original).toBeDefined();
  for (const next of [
    state(['home', 'profile']),
    state(['home', 'search']),
    { ...current, key: 'tabs-new-account' },
    { ...current, routes: routes.map((route) => ({ ...route, name: `${route.name}-replaced` })) },
  ]) {
    expect(tabBackPreview(next)?.sessionKey).not.toBe(original);
  }
});

it('refuses stale, unknown or non-route history instead of displaying the wrong destination', () => {
  const current = state(['home', 'profile']);
  for (const history of [
    [entry('home'), entry('search')],
    [entry('removed'), entry('profile')],
    [entry('profile'), entry('profile')],
    [{ type: 'drawer', key: 'home-1' }, entry('profile')],
    [null, entry('profile')],
  ]) {
    expect(tabBackPreview({ ...current, history })).toBeNull();
  }
});
