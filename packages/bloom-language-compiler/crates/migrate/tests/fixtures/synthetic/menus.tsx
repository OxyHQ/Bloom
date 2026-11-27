// `actions(function …)` and `menu(function …)` are structs conforming to `MenuActions` and
// `MenuContent` (#1046): the props are stored `let`s, the hooks members, the result `body`.
// Rows are builder lines; a props object handed on whole is rebuilt from the stored `let`s.
import { useTranslation } from 'react-i18next';
import { Divider, Item, Menu, Text, actions, menu, type Child } from '@oxy.so/bloom-language';

export interface MoreProps {
  id: string;
  title: string | null;
  canEdit: boolean;
  label: string;
}

export interface MoreActionsProps {
  id: string;
  onEdit: () => void;
}

function table(props: MoreActionsProps, open: (id: string) => void): Record<string, () => void> {
  return { open: () => open(props.id), edit: props.onEdit };
}

export const MoreActions = actions(function MoreActions(props: MoreActionsProps) {
  const { t } = useTranslation();
  return table(props, (id) => console.log(t('menu.opened'), id));
});

const MoreRows = menu(function MoreRows({
  id,
  canEdit,
}: Omit<MoreProps, 'label' | 'title'> & { title: string }) {
  return [
    Item('Open').tag('open'),
    canEdit && [Divider(), Item(`Edit ${id}`).tag('edit')],
  ];
});

export function MoreMenu(trigger: Child, { id, title, canEdit, label }: MoreProps): Child {
  if (!title) return null;
  return Menu(trigger, MoreRows({ id, title, canEdit })).label(label);
}

export function Heading({ title }: { title: string }): Child {
  return Text(title);
}
