import type {
  CappedChipRowView,
  ChipRowView,
  GroupedSectionCollapseView,
  GroupedSectionDividerView,
  GroupedSectionIconView,
  SelectionCardView,
  TabContentView,
  AdmonitionView,
  CardPartView,
  CardTextView,
  CardView,
  ChipView,
  EmptyStateView,
  ErrorBoundaryView,
  GroupedSectionItemView,
  GroupedSectionView,
  KbdView,
  RowView,
  TabItemView,
  TabsView,
} from '../controls/containers';
import type { NODE_MODIFIERS } from '../generated/spec.generated';

describe('the containers’ views', () => {
  it('each exposes exactly the modifiers the spec gives its kind', () => {
    type MethodsOf<T> = {
      [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
    }[keyof T];
    type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    type Of<K extends keyof typeof NODE_MODIFIERS> = (typeof NODE_MODIFIERS)[K][number];
    // A type error here means a view interface and spec/language.json disagree.
    const checks: [
      Same<MethodsOf<CardView>, Of<'card'>>,
      Same<MethodsOf<CardPartView>, Of<'cardHeader'>>,
      Same<MethodsOf<CardPartView>, Of<'cardBody'>>,
      Same<MethodsOf<CardPartView>, Of<'cardFooter'>>,
      Same<MethodsOf<CardTextView>, Of<'cardTitle'>>,
      Same<MethodsOf<CardTextView>, Of<'cardDescription'>>,
      Same<MethodsOf<RowView>, Of<'row'>>,
      Same<MethodsOf<GroupedSectionView>, Of<'groupedSection'>>,
      Same<MethodsOf<GroupedSectionItemView>, Of<'groupedSectionItem'>>,
      Same<MethodsOf<ChipView>, Of<'chip'>>,
      Same<MethodsOf<EmptyStateView>, Of<'emptyState'>>,
      Same<MethodsOf<AdmonitionView>, Of<'admonition'>>,
      Same<MethodsOf<TabsView>, Of<'tabs'>>,
      Same<MethodsOf<TabItemView>, Of<'tabItem'>>,
      Same<MethodsOf<KbdView>, Of<'kbd'>>,
      Same<MethodsOf<ErrorBoundaryView>, Of<'errorBoundary'>>,
      Same<MethodsOf<ChipRowView>, Of<'chipRow'>>,
      Same<MethodsOf<CappedChipRowView>, Of<'cappedChipRow'>>,
      Same<MethodsOf<GroupedSectionIconView>, Of<'groupedSectionIcon'>>,
      Same<MethodsOf<GroupedSectionDividerView>, Of<'groupedSectionDivider'>>,
      Same<MethodsOf<GroupedSectionCollapseView>, Of<'groupedSectionCollapse'>>,
      Same<MethodsOf<TabContentView>, Of<'tabContent'>>,
      Same<MethodsOf<SelectionCardView>, Of<'selectionCard'>>,
    ] = [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ];
    expect(checks.every(Boolean)).toBe(true);
  });
});
