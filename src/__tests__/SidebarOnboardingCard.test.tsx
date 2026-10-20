import { Text, ScrollView } from 'react-native';
import { render } from '@testing-library/react-native';
import { LocaleProvider } from '../locale';
import { Sidebar, SidebarOnboardingCard } from '../sidebar';
import type { SidebarOnboardingCardProps, SidebarProps } from '../sidebar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { pressHost } from './support/press-host';

const steps = [
  { key: 'created', label: 'Create a page', completed: true },
  { key: 'write', label: 'Write your first note', onPress: jest.fn() },
  { key: 'team', label: 'Invite your team', onPress: jest.fn() },
  { key: 'board', label: 'Track a project', onPress: jest.fn() },
];
const onboarding: SidebarOnboardingCardProps = {
  title: 'Welcome to your workspace',
  steps,
};

function card(props: Partial<SidebarOnboardingCardProps> = {}, locale = 'en') {
  return (
    <BloomThemeProvider fonts={false}>
      <LocaleProvider locale={locale}>
        <SidebarOnboardingCard {...onboarding} {...props} />
      </LocaleProvider>
    </BloomThemeProvider>
  );
}

function sidebar(props: SidebarProps = {}) {
  return (
    <BloomThemeProvider fonts={false}>
      <Sidebar
        testID="nav"
        showSearch={false}
        showThemeToggle={false}
        onboarding={onboarding}
        content={<Text>Pages</Text>}
        {...props}
      />
    </BloomThemeProvider>
  );
}

beforeEach(() => jest.clearAllMocks());

it('shows the first two incomplete tasks and leaves completion controlled by the app', () => {
  const tree = render(card());
  expect(tree.queryByText('Create a page')).toBeNull();
  expect(tree.queryByText('Track a project')).toBeNull();
  pressHost(tree.getByRole('button', { name: 'Write your first note' }));
  expect(steps[1]?.onPress).toHaveBeenCalledTimes(1);
  expect(tree.getByText('Write your first note')).toBeTruthy();
  tree.rerender(
    card({
      steps: steps.map((step) => ({ ...step, completed: step.key === 'write' || step.completed })),
    }),
  );
  expect(tree.queryByText('Write your first note')).toBeNull();
  expect(tree.getByText('Invite your team')).toBeTruthy();
  expect(tree.getByText('Track a project')).toBeTruthy();
});

it('keeps header, steps and footer as separate named actions', () => {
  const onPress = jest.fn();
  const onSeeAll = jest.fn();
  const tree = render(card({ onPress, onSeeAll, leading: <Text>Mark</Text> }));
  pressHost(tree.getByRole('button', { name: onboarding.title }));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onSeeAll).not.toHaveBeenCalled();
  pressHost(tree.getByRole('button', { name: 'See all' }));
  expect(onSeeAll).toHaveBeenCalledTimes(1);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(steps[1]?.onPress).not.toHaveBeenCalled();
  expect(tree.queryByText('Mark')).toBeNull();
});

it('does not turn static content into a dead button and does not invent a footer flow', () => {
  const tree = render(card({ steps: [{ key: 'read', label: 'Read the guide' }] }));
  expect(tree.getByText(onboarding.title)).toBeTruthy();
  expect(tree.getByText('Read the guide')).toBeTruthy();
  expect(tree.queryAllByRole('button')).toHaveLength(0);
  expect(tree.queryByText('See all')).toBeNull();
});

it('respects disabled tasks and caller limits without changing the supplied steps', () => {
  const onPress = jest.fn();
  const tree = render(
    card({
      steps: [{ key: 'invite', label: 'Invite team', onPress, disabled: true }],
      visibleCount: 1,
    }),
  );
  const task = tree.getByRole('button', { name: 'Invite team' });
  expect(task.props.accessibilityState).toEqual({ disabled: true });
  expect(task.props.onPress).toBeUndefined();
  expect(onPress).not.toHaveBeenCalled();
  tree.rerender(card({ visibleCount: 0 }));
  expect(tree.queryByText('Write your first note')).toBeNull();
  tree.rerender(card({ visibleCount: 3 }));
  expect(tree.getByText('Track a project')).toBeTruthy();
});

it('localizes the footer and accepts an app-specific label', () => {
  const onSeeAll = jest.fn();
  const tree = render(card({ onSeeAll }, 'es'));
  expect(tree.getByRole('button', { name: 'Ver todo' })).toBeTruthy();
  tree.rerender(card({ onSeeAll, seeAllLabel: 'Abrir guía' }, 'es'));
  pressHost(tree.getByRole('button', { name: 'Abrir guía' }));
  expect(onSeeAll).toHaveBeenCalledTimes(1);
});

it('uses the same scrolling destination viewport and hides controls in collapsed and rail layouts', () => {
  const tree = render(sidebar());
  expect(tree.UNSAFE_getAllByType(ScrollView)).toHaveLength(1);
  expect(tree.getByTestId('nav-onboarding')).toBeTruthy();
  let insideScroll = false;
  for (let parent = tree.getByText(onboarding.title).parent; parent; parent = parent.parent) {
    if (parent.props.testID === 'nav-scroll') insideScroll = true;
  }
  expect(insideScroll).toBe(true);
  tree.rerender(sidebar({ collapsed: true }));
  expect(tree.queryByText(onboarding.title, { includeHiddenElements: true })).toBeNull();
  tree.rerender(sidebar({ mobile: true, collapsed: true }));
  expect(tree.getByText(onboarding.title)).toBeTruthy();
  tree.rerender(sidebar({ variant: 'rail' }));
  expect(tree.queryByText(onboarding.title, { includeHiddenElements: true })).toBeNull();
});
