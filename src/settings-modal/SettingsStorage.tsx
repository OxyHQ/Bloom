import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Checkbox } from '../checkbox';
import { Chip } from '../chip';
import { FileUpload, formatFileSize } from '../file-upload';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiDeleteBin6Line } from '../icons/remix/RiDeleteBin6Line';
import { RiDownload2Line } from '../icons/remix/RiDownload2Line';
import { RiEditLine } from '../icons/remix/RiEditLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiFileExcel2Line } from '../icons/remix/RiFileExcel2Line';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiVideoLine } from '../icons/remix/RiVideoLine';
import type { BloomIconComponent } from '../icons/icon-component';
import { useCommonMessages } from '../locale/common-messages';
import { formatInteger } from '../locale/format-number';
import { useMessages } from '../locale/messages';
import { Pagination } from '../pagination';
import { RowActions } from '../row-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type TableSortDirection,
} from '../table';
import { borderRadius } from '../styles/tokens';
import { SettingsSelect } from './SettingsSelect';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { Text } from '../typography';
import { useSettingsLayout, useSettingsPalette } from './context';
import { SETTINGS_MODAL_MESSAGES, type SettingsModalMessages } from './messages';
import type { SettingsPalette } from './palette';
import { settingsRingVars } from './SettingsRows';
import type { SettingsFileKind, SettingsMenuAction, SettingsStoragePageProps } from './types';
import { useSettingsWebCss } from './web-css';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

/**
 * The Storage page.
 *
 * DROPZONE  Bloom's `FileUpload`, configured through `upload`; the page adds 10px of headroom above it
 *           for the progress badge straddling its top edge.
 *
 * TABLE (1px border-table, radius 16, pt 8 pb 12)
 *   toolbar  px 12 py 4: "Stored in" (text/tertiary) over "N files", then the
 *            type and order selects and a 153px pill search, 10 apart
 *   header   8 below; 1px hairlines top and bottom, background/secondary, pl 12;
 *            File name (flex, py 10, checkbox + 8) / Uploaded on 150 / File size
 *            104 / Actions 116, each px 12 py 10; sortable labels body-medium
 *            text/tertiary (active text/primary) + a 24px sort caret
 *   rows     pl 12, 1px separator under each; 24px file icon + name, the date,
 *            a size chip, and delete + "⋮" (32px, 10 apart, tooltips)
 *   motion   a row that appears grows in from under the header (400ms ease-out,
 *            fade 240ms); a deleted row collapses and slides up (225ms ease-in,
 *            fade 160ms) before `onDeleteFile`
 *   footer   pagination, px 12 pt 12
 */

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

const EASE_OUT = Easing.bezier(0, 0, 0.2, 1);
const EASE_IN = Easing.bezier(0.4, 0, 1, 1);

// ---------------------------------------------------------------------------
//  Table pieces
// ---------------------------------------------------------------------------

type SortKey = 'name' | 'uploadedAt' | 'size';
type SortState = { key: SortKey; dir: Exclude<TableSortDirection, 'none'> } | null;

function defaultFileActions(messages: SettingsModalMessages): SettingsMenuAction[] {
  return [
    { id: 'download', label: messages.storage.downloadFile, icon: RiDownload2Line },
    { id: 'rename', label: messages.storage.rename, icon: RiEditLine },
    { id: 'copy-link', label: messages.storage.copyLink, icon: RiFileCopyLine },
  ];
}

type RowPhase = 'idle' | 'entering' | 'exiting';

/**
 * `AnimatedRow`: a grid track growing 0 → row height while the
 * content slides down from −100% (400ms ease-out, fade 240ms); the exit is the
 * structural reverse (225ms ease-in, fade 160ms).
 */
function AnimatedRow({
  phase,
  onExited,
  children,
}: {
  phase: RowPhase;
  onExited: () => void;
  children: ReactNode;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const measured = useSharedValue(0);
  const progress = useSharedValue(phase === 'entering' ? 0 : 1);
  const opacity = useSharedValue(phase === 'entering' ? 0 : 1);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  useEffect(() => {
    const exited = () => onExitedRef.current();
    if (phase === 'entering') {
      if (reducedMotion) {
        progress.value = 1;
        opacity.value = 1;
        return;
      }
      progress.value = withTiming(1, { duration: 400, easing: EASE_OUT });
      opacity.value = withTiming(1, { duration: 240, easing: EASE_OUT });
    } else if (phase === 'exiting') {
      if (reducedMotion) {
        exited();
        return;
      }
      opacity.value = withTiming(0, { duration: 160, easing: EASE_IN });
      progress.value = withTiming(0, { duration: 225, easing: EASE_IN }, (finished) => {
        'worklet';
        if (finished) runOnJS(exited)();
      });
    }
  }, [phase, reducedMotion, progress, opacity]);

  const outer = useAnimatedStyle(
    () => ({
      height:
        progress.value >= 1 || measured.value === 0 ? 'auto' : progress.value * measured.value,
      overflow: 'hidden',
    }),
    [progress, measured],
  );
  const inner = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
      transform: [{ translateY: -(1 - progress.value) * measured.value }],
    }),
    [progress, opacity, measured],
  );
  return (
    <Animated.View style={outer} pointerEvents={phase === 'exiting' ? 'none' : 'auto'}>
      <Animated.View
        style={inner}
        onLayout={(event) => {
          if (measured.value === 0 || progress.value >= 1)
            measured.value = event.nativeEvent.layout.height;
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

function defaultStoredIcon(kind: string, palette: SettingsPalette): ReactNode {
  const Icon =
    kind === 'spreadsheet' ? RiFileExcel2Line : kind === 'video' ? RiVideoLine : RiFileTextLine;
  return <Icon width={24} height={24} fill={palette.iconSecondary} />;
}

// ---------------------------------------------------------------------------
//  Page
// ---------------------------------------------------------------------------

function defaultKinds(messages: SettingsModalMessages): SettingsFileKind[] {
  return [
    { value: 'document', label: messages.storage.documents },
    { value: 'spreadsheet', label: messages.storage.spreadsheets },
    { value: 'video', label: messages.storage.videos },
  ];
}

export function SettingsStoragePage({
  files,
  kinds: kindsProp,
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  pageSize = 6,
  onDeleteFile,
  fileActions: fileActionsProp,
  onFileAction,
  renderFileIcon,
  upload,
  style,
  testID,
}: SettingsStoragePageProps) {
  const { locale, messages } = useMessages(SETTINGS_MODAL_MESSAGES);
  const common = useCommonMessages();
  const copy = messages.storage;
  useSettingsWebCss();
  const palette = useSettingsPalette();
  const kinds = useMemo(() => kindsProp ?? defaultKinds(messages), [kindsProp, messages]);
  const fileActions = useMemo(
    () => fileActionsProp ?? defaultFileActions(messages),
    [fileActionsProp, messages],
  );
  const orderItems = useMemo<SettingsFileKind[]>(
    () => [
      { value: 'newest', label: copy.modified },
      { value: 'oldest', label: copy.oldestFirst },
    ],
    [copy],
  );
  const [selected, setSelected] = useControllableState<string[]>({
    value: selectedIds,
    defaultValue: defaultSelectedIds,
    onChange: onSelectionChange,
  });
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const [page, setPage] = useState(1);
  const [kindFilter, setKindFilter] = useState('all');
  const [recency, setRecency] = useState<'newest' | 'oldest'>('newest');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>(null);
  const [exiting, setExiting] = useState<Set<string>>(() => new Set());

  // Rows that were not in the previous `files` grow in; the first render does not animate.
  const seen = useRef<Set<string> | null>(null);
  const entering = useMemo(() => {
    const prev = seen.current;
    if (!prev) return new Set<string>();
    return new Set(files.filter((f) => !prev.has(f.id)).map((f) => f.id));
  }, [files]);
  useEffect(() => {
    seen.current = new Set(files.map((f) => f.id));
  }, [files]);
  // A newly arrived file sends the table back to its first page.
  useEffect(() => {
    if (entering.size > 0) setPage(1);
  }, [entering]);

  const onSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'ascending' };
      if (prev.dir === 'ascending') return { key, dir: 'descending' };
      return null;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = files.filter(
      (f) =>
        (kindFilter === 'all' || f.kind === kindFilter) &&
        (q === '' || f.name.toLowerCase().includes(q)),
    );
    if (sort) {
      const { key, dir } = sort;
      rows.sort((a, b) => {
        const cmp =
          key === 'name'
            ? a.name.localeCompare(b.name)
            : key === 'size'
              ? a.size - b.size
              : a.uploadedAt - b.uploadedAt;
        return dir === 'ascending' ? cmp : -cmp;
      });
    } else {
      rows.sort((a, b) =>
        recency === 'newest' ? b.uploadedAt - a.uploadedAt : a.uploadedAt - b.uploadedAt,
      );
    }
    return rows;
  }, [files, kindFilter, query, sort, recency]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedOnPage = rows.filter((f) => selectedSet.has(f.id)).length;
  const allOnPage = rows.length > 0 && selectedOnPage === rows.length;
  const someOnPage = selectedOnPage > 0 && !allOnPage;

  const toggleRow = (id: string, on: boolean) => {
    const next = new Set(selectedSet);
    if (on) next.add(id);
    else next.delete(id);
    setSelected([...next]);
  };
  const toggleAll = (on: boolean) => {
    const next = new Set(selectedSet);
    for (const f of rows) {
      if (on) next.add(f.id);
      else next.delete(f.id);
    }
    setSelected([...next]);
  };

  const deleteFile = (id: string) => {
    setExiting((prev) => new Set(prev).add(id));
  };
  const finishDelete = (id: string) => {
    setExiting((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedSet.has(id)) toggleRow(id, false);
    onDeleteFile?.(id);
  };

  // Compact: the table keeps name + actions; date and size columns drop, the
  // toolbar wraps and the search takes the remaining width.
  const compact = useSettingsLayout() === 'compact';

  const typeItems = useMemo(
    () => [{ value: 'all', label: copy.fileType }, ...kinds],
    [copy, kinds],
  );

  const sortable = (key: SortKey) => ({
    onSort: () => onSort(key),
    sortDirection: sort?.key === key ? sort.dir : ('none' as const),
    accessibilityLabel: copy.sortBy[key],
  });
  // The sorted column's label reads in the primary text colour.
  const headerLabel = (label: string, active: boolean) => (
    <Text
      variant="body-medium"
      numberOfLines={1}
      style={{ color: active ? palette.text : palette.textTertiary }}
    >
      {label}
    </Text>
  );

  return (
    <View testID={testID} style={[styles.page, settingsRingVars(palette), style]}>
      {upload === false ? null : (
        <FileUpload {...upload} testID={testID ? `${testID}-dropzone` : undefined} />
      )}

      <View
        style={[styles.table, { borderColor: palette.separator }]}
        testID={testID ? `${testID}-table` : undefined}
      >
        <View style={styles.toolbar}>
          <View>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
              {copy.storedIn}
            </Text>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
              {copy.fileCount(filtered.length, formatInteger(filtered.length, locale))}
            </Text>
          </View>
          <View style={[styles.tools, compact ? styles.toolsCompact : null]}>
            <SettingsSelect
              compact={false}
              label={copy.filterByType}
              value={kindFilter}
              onChange={(v) => {
                setKindFilter(v);
                setPage(1);
              }}
              items={typeItems}
            />
            <SettingsSelect
              compact={false}
              label={copy.orderBy}
              value={recency}
              onChange={(v) => {
                setRecency(v === 'oldest' ? 'oldest' : 'newest');
                setSort(null);
                setPage(1);
              }}
              items={orderItems}
            />
            <View style={[styles.search, compact ? styles.searchCompact : null]}>
              <TextField radius={borderRadius.full}>
                <TextFieldIcon icon={RiSearchLine} />
                <TextFieldInput
                  label={copy.searchFiles}
                  placeholder={common.search}
                  value={query}
                  onValueChange={(text) => {
                    setQuery(text);
                    setPage(1);
                  }}
                />
              </TextField>
            </View>
          </View>
        </View>

        <Table size="md" containerStyle={styles.tableBody}>
          <TableHeader style={styles.inset}>
            <TableColumn
              leading={
                <Checkbox
                  checked={allOnPage}
                  indeterminate={someOnPage}
                  onCheckedChange={toggleAll}
                  accessibilityLabel={copy.selectAllOnPage}
                />
              }
              {...sortable('name')}
              style={styles.flush}
            >
              {headerLabel(copy.fileName, sort?.key === 'name')}
            </TableColumn>
            {compact ? null : (
              <TableColumn width={150} {...sortable('uploadedAt')}>
                {headerLabel(copy.uploadedOn, sort?.key === 'uploadedAt')}
              </TableColumn>
            )}
            {compact ? null : (
              <TableColumn width={104} {...sortable('size')}>
                {headerLabel(copy.fileSize, sort?.key === 'size')}
              </TableColumn>
            )}
            <TableColumn width={compact ? 'auto' : 116} align="end">
              {headerLabel(messages.actions, false)}
            </TableColumn>
          </TableHeader>
          <TableBody style={styles.inset}>
            {rows.length > 0 ? (
              rows.map((file) => (
                <AnimatedRow
                  key={file.id}
                  phase={
                    exiting.has(file.id) ? 'exiting' : entering.has(file.id) ? 'entering' : 'idle'
                  }
                  onExited={() => finishDelete(file.id)}
                >
                  <TableRow
                    style={styles.row}
                    testID={testID ? `${testID}-row-${file.id}` : undefined}
                  >
                    <TableCell style={[styles.flush, styles.nameCell]}>
                      <Checkbox
                        checked={selectedSet.has(file.id)}
                        onCheckedChange={(on) => toggleRow(file.id, on)}
                        accessibilityLabel={copy.selectFile(file.name)}
                      />
                      <View style={styles.fileName}>
                        {renderFileIcon
                          ? renderFileIcon(file)
                          : defaultStoredIcon(file.kind, palette)}
                        <Text
                          variant="body-medium"
                          numberOfLines={1}
                          style={[styles.shrink, { color: palette.text }]}
                        >
                          {file.name}
                        </Text>
                      </View>
                    </TableCell>
                    {compact ? null : (
                      <TableCell>
                        <Text
                          variant="body-medium"
                          numberOfLines={1}
                          style={{ color: palette.text }}
                        >
                          {file.uploadedOn}
                        </Text>
                      </TableCell>
                    )}
                    {compact ? null : (
                      <TableCell>
                        <Chip
                          size="lg"
                          style={{ backgroundColor: palette.secondary }}
                          textStyle={{ color: palette.text }}
                        >
                          {file.sizeLabel ?? formatFileSize(file.size, locale)}
                        </Chip>
                      </TableCell>
                    )}
                    <TableCell>
                      <RowActions
                        name={file.name}
                        actions={[
                          {
                            icon: RiDeleteBin6Line,
                            label: copy.deleteFile,
                            accessibilityLabel: copy.deleteNamed(file.name),
                            onPress: () => deleteFile(file.id),
                          },
                        ]}
                        menu={fileActions.map((action) => ({
                          // A settings icon is drawn with the same width, height and fill.
                          icon: action.icon as BloomIconComponent | undefined,
                          label: action.label,
                          onPress: () => onFileAction?.(file.id, action.id),
                        }))}
                        menuAppearance="outline"
                        menuWidth={200}
                      />
                    </TableCell>
                  </TableRow>
                </AnimatedRow>
              ))
            ) : (
              <View style={styles.empty}>
                <Text variant="body-medium" style={{ color: palette.textTertiary }}>
                  {copy.noMatches}
                </Text>
              </View>
            )}
          </TableBody>
        </Table>

        <View style={styles.footer}>
          <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    gap: 24,
    // Headroom for the progress badge straddling the dropzone's top edge.
    paddingTop: 10,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  search: {
    width: 153,
  },
  toolsCompact: {
    flexWrap: 'wrap',
    width: '100%',
  },
  searchCompact: {
    width: 'auto',
    flexGrow: 1,
    minWidth: 160,
  },
  tableBody: {
    marginTop: 8,
  },
  /** Header and rows sit behind a 12px leading gutter, so row hairlines start at 12. */
  inset: {
    paddingLeft: 12,
  },
  /** The first column runs flush against that gutter. */
  flush: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  fileName: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /** Every row draws its hairline, the last one too: the footer draws none. */
  row: {
    borderBottomWidth: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    paddingRight: 12,
  },
  footer: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
  },
});
