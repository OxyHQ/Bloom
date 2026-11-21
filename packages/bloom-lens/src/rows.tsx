/**
 * Bloom's rows as the upstream menu's own parts (`Menu.Item`, `Menu.Submenu`, `Menu.Label`,
 * `Menu.Separator`), so the menu reads them as it reads the upstream app's: Bloom gives data
 * and glyph views, the menu does the rest.
 */
import type { ReactNode } from 'react';

import { Menu } from './menu';

/** One row of a lens menu. */
export type LensRow =
  | {
      kind: 'item';
      id: string;
      title: string;
      subtitle?: string;
      /** The row's glyph, a view drawn in the row's ink. */
      icon?: ReactNode;
      checked?: boolean;
      destructive?: boolean;
      disabled?: boolean;
      keepOpen?: boolean;
      onSelect?: () => void;
    }
  | { kind: 'submenu'; id: string; title: string; rows: readonly LensRow[] }
  | { kind: 'heading'; id: string; title: string }
  | { kind: 'separator'; id: string };

/** The rows as the menu's children (a submenu holds items only, as upstream). */
export function lensRows(rows: readonly LensRow[]): ReactNode[] {
  return rows.map((row) => {
    switch (row.kind) {
      case 'separator':
        return <Menu.Separator key={row.id} />;
      case 'heading':
        return <Menu.Label key={row.id}>{row.title}</Menu.Label>;
      case 'submenu':
        return (
          <Menu.Submenu key={row.id} id={row.id} title={row.title}>
            {lensRows(row.rows)}
          </Menu.Submenu>
        );
      case 'item':
        return (
          <Menu.Item
            key={row.id}
            id={row.id}
            checked={row.checked}
            destructive={row.destructive}
            disabled={row.disabled}
            keepOpen={row.keepOpen}
            onSelect={row.onSelect}
          >
            {row.icon ? <Menu.Item.Icon>{row.icon}</Menu.Item.Icon> : null}
            <Menu.Item.Title>{row.title}</Menu.Item.Title>
            {row.subtitle ? <Menu.Item.Subtitle>{row.subtitle}</Menu.Item.Subtitle> : null}
          </Menu.Item>
        );
    }
  });
}
