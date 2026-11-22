import { RiDeleteBinLine } from '@bloom/icons/remix/RiDeleteBinLine';
import { RowActionButton, RowActions } from '@bloom/row-actions';
import type { Cases } from '../support/cases';

export const CASES: Cases = {
  'RowActions plain': () => <RowActions name="Ana" testID="row" />,
  'RowActions loaded': () => (
    <RowActions
      name="Ana"
      actions={[{ icon: RiDeleteBinLine, label: 'Delete' }]}
      menu={[{ icon: RiDeleteBinLine, label: 'Remove' }, { label: 'Archive' }]}
      menuAppearance="outline"
      testID="row"
    />
  ),
  'RowActionButton active': () => <RowActionButton icon={RiDeleteBinLine} label="Delete" active />,
};
