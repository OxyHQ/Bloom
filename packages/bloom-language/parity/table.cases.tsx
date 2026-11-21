import { Checkbox } from '@oxy.so/bloom/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@oxy.so/bloom/table';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const sort = () => {};
const set = () => {};

/** Two columns and two rows, as the language writes them. */
const languageRows = () =>
  L.TableBody(
    L.TableRow(L.TableCell('Ana Lima'), L.TableCell(42)),
    L.TableRow(L.TableCell('Rui Costa'), L.TableCell(7)).selected(true),
  );
const bloomRows = () => (
  <TableBody>
    <TableRow>
      <TableCell>Ana Lima</TableCell>
      <TableCell>{42}</TableCell>
    </TableRow>
    <TableRow selected>
      <TableCell>Rui Costa</TableCell>
      <TableCell>{7}</TableCell>
    </TableRow>
  </TableBody>
);

export const TABLE_CASES: readonly ParityCase[] = [
  {
    name: 'a table',
    language: () =>
      toElement(
        L.Table(L.TableHeader(L.TableColumn('Name'), L.TableColumn('Score')), languageRows()),
      ),
    bloom: () => (
      <Table>
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Score</TableColumn>
        </TableHeader>
        {bloomRows()}
      </Table>
    ),
  },
  ...ENUMS.tableSize.map((size) => ({
    name: `a ${size} table, named, scrolling below a width`,
    language: () =>
      toElement(
        L.Table(L.TableHeader(L.TableColumn('Name'), L.TableColumn('Score')), languageRows())
          .size(size)
          .minWidth('640')
          .label('Scores')
          .testID('scores'),
      ),
    bloom: () => (
      <Table size={size} minWidth={640} accessibilityLabel="Scores" testID="scores">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Score</TableColumn>
        </TableHeader>
        {bloomRows()}
      </Table>
    ),
  })),
  ...ENUMS.tableAlign.map((align) => ({
    name: `columns laid out, the second ${align}`,
    language: () =>
      toElement(
        L.Table(
          L.TableHeader(
            L.TableColumn('Name').width('160').minWidth('96'),
            L.TableColumn('Score').share(2).align(align),
            L.TableColumn('').width('fit'),
          ),
          L.TableBody(
            L.TableRow(L.TableCell('Ana'), L.TableCell(42), L.TableCell('…').align('center')),
          ),
        ),
      ),
    bloom: () => (
      <Table>
        <TableHeader>
          <TableColumn width={160} minWidth={96}>
            Name
          </TableColumn>
          <TableColumn flex={2} align={align}>
            Score
          </TableColumn>
          <TableColumn width="auto">{''}</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ana</TableCell>
            <TableCell>{42}</TableCell>
            <TableCell align="center">…</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  })),
  ...ENUMS.tableSort.map((direction) => ({
    name: `a sortable column, ${direction}`,
    language: () =>
      toElement(
        L.Table(
          L.TableHeader(L.TableColumn('Name').sort(direction, sort), L.TableColumn('Score')),
          languageRows(),
        ),
      ),
    bloom: () => (
      <Table>
        <TableHeader>
          <TableColumn sortDirection={direction} onSort={sort}>
            Name
          </TableColumn>
          <TableColumn>Score</TableColumn>
        </TableHeader>
        {bloomRows()}
      </Table>
    ),
  })),
  {
    name: 'a select-all checkbox before a label; views in cells',
    language: () =>
      toElement(
        L.Table(
          L.TableHeader(
            L.TableColumn('Name').prefix(
              L.Embed(<Checkbox checked={false} onCheckedChange={set} />),
            ),
            L.TableColumn(L.Text('Score').weight('bold')).label('Score'),
          ),
          L.TableBody(L.TableRow(L.TableCell(L.Text('Ana').foreground('muted')), L.TableCell(42))),
        ),
      ),
    bloom: () => (
      <Table>
        <TableHeader>
          <TableColumn leading={<Checkbox checked={false} onCheckedChange={set} />}>
            Name
          </TableColumn>
          <TableColumn accessibilityLabel="Score">
            <Text style={{ fontWeight: '700' }}>Score</Text>
          </TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <Themed>{(c) => <Text style={{ color: c.textSecondary }}>Ana</Text>}</Themed>
            </TableCell>
            <TableCell>{42}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
  {
    name: 'an empty body, a string',
    language: () =>
      toElement(
        L.Table(L.TableHeader(L.TableColumn('Name')), L.TableBody().emptyState('No rows yet')),
      ),
    bloom: () => (
      <Table>
        <TableHeader>
          <TableColumn>Name</TableColumn>
        </TableHeader>
        <TableBody emptyState="No rows yet" />
      </Table>
    ),
  },
  {
    name: 'an empty body, a view',
    language: () =>
      toElement(
        L.Table(
          L.TableHeader(L.TableColumn('Name')),
          L.TableBody().emptyState(L.Text('Nothing here').weight('semibold')),
        ),
      ),
    bloom: () => (
      <Table>
        <TableHeader>
          <TableColumn>Name</TableColumn>
        </TableHeader>
        <TableBody emptyState={<Text style={{ fontWeight: '600' }}>Nothing here</Text>} />
      </Table>
    ),
  },
  {
    name: 'rows unselected and selected, and test ids on each part',
    language: () =>
      toElement(
        L.Table(
          L.TableHeader(L.TableColumn('Name').testID('name')).testID('head'),
          L.TableBody(
            L.TableRow(L.TableCell('Ana').testID('cell')).selected(false).testID('row'),
          ).testID('body'),
        ),
      ),
    bloom: () => (
      <Table>
        <TableHeader testID="head">
          <TableColumn testID="name">Name</TableColumn>
        </TableHeader>
        <TableBody testID="body">
          <TableRow selected={false} testID="row">
            <TableCell testID="cell">Ana</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
];
