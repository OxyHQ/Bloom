// `type P = Q & { … }` of object types here is one struct of all their fields; a menu whose
// props it types, handed one such value (`Rows(options)`), takes each field. A write by key
// into a captured table, inside a closure, is a subscript set.
import { Item, Menu, menu, type Child } from '@oxy.so/bloom-language';

export interface Settings {
  quotesDisabled: boolean;
  onQuotesDisabledChange: (disabled: boolean) => void;
}

type RowsProps = Settings & { title: string };

export function SettingsMenu(trigger: Child, options: RowsProps): Child {
  return Menu(trigger, Rows(options)).label(options.title);
}

const Rows = menu(function Rows({ quotesDisabled, onQuotesDisabledChange, title }: RowsProps) {
  return [
    Item(title)
      .checked(!quotesDisabled)
      .onPress(() => onQuotesDisabledChange(!quotesDisabled)),
  ];
});

export function tagged(tags: string[]): Record<string, () => void> {
  const handlers: Record<string, () => void> = {};
  const add = (tag: string) => {
    handlers[tag] = () => console.log(tag);
    return tag;
  };
  tags.forEach((tag) => add(tag));
  return handlers;
}
