import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import { Chip } from '../chip';
import { FileUpload, formatFileSize } from '../file-upload';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../dropdown-menu';
import { useControllableState } from '../hooks/use-controllable-state';
import { RiDeleteBin6Line } from '../icons/remix/RiDeleteBin6Line';
import { RiDownload2Line } from '../icons/remix/RiDownload2Line';
import { RiEditLine } from '../icons/remix/RiEditLine';
import { RiFileCopyLine } from '../icons/remix/RiFileCopyLine';
import { RiFileExcel2Line } from '../icons/remix/RiFileExcel2Line';
import { RiFileTextLine } from '../icons/remix/RiFileTextLine';
import { RiMore2Fill } from '../icons/remix/RiMore2Fill';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { RiVideoLine } from '../icons/remix/RiVideoLine';
import { Pagination } from '../pagination';
import { Select, SelectContent, SelectIcon, SelectItem, SelectItemIndicator, SelectItemText, SelectTrigger, SelectValue } from '../select';
import { borderRadius } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import { Text } from '../typography';
import { useSettingsLayout, useSettingsPalette } from './context';
import type { SettingsPalette } from './palette';
import { settingsRingVars } from './SettingsRows';
import type {
  SettingsFileKind,
  SettingsMenuAction,
  SettingsStoragePageProps,
  SettingsStoredFile,
} from './types';
import { useSettingsWebCss } from './web-css';

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
type SortState = { key: SortKey; dir: 'asc' | 'desc' } | null;

/** The sort caret. */
function SortCaret({ color, up }: { color: string; up: boolean }) {
  return (
    <View style={[styles.caret, up ? styles.caretUp : null]}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12.7071 15.2929C12.3166 15.6834 11.6834 15.6834 11.2929 15.2929L7.70711 11.7071C7.07714 11.0771 7.52331 10 8.41421 10H15.5858C16.4767 10 16.9229 11.0771 16.2929 11.7071L12.7071 15.2929Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const palette = useSettingsPalette();
  const active = sort?.key === sortKey;
  return (
    <Pressable
      role="button"
      accessibilityLabel={`Sort by ${label}`}
      {...webDataSet({ bloomSettingsPress: '', ringOffset: '' })}
      onPress={() => onSort(sortKey)}
      style={styles.sortable}
    >
      <Text variant="body-medium" numberOfLines={1} style={{ color: active ? palette.text : palette.textTertiary }}>
        {label}
      </Text>
      <SortCaret color={active ? palette.textSecondary : palette.textTertiary} up={active && sort?.dir === 'asc'} />
    </Pressable>
  );
}

/** A hover/focus tooltip around a control that already has its own name. */
function HoverTooltip({ label, children }: { label: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const enter = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(true), 200);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };
  return (
    <Tooltip visible={visible} onVisibleChange={setVisible} position="top">
      <TooltipTrigger>
        <View onPointerEnter={enter} onPointerLeave={leave}>
          {children}
        </View>
      </TooltipTrigger>
      <TooltipTextBubble>{label}</TooltipTextBubble>
    </Tooltip>
  );
}

const DEFAULT_FILE_ACTIONS: SettingsMenuAction[] = [
  { id: 'download', label: 'Download file', icon: RiDownload2Line },
  { id: 'rename', label: 'Rename', icon: RiEditLine },
  { id: 'copy-link', label: 'Copy link', icon: RiFileCopyLine },
];

function RowMoreMenu({
  file,
  actions,
  onAction,
}: {
  file: SettingsStoredFile;
  actions: SettingsMenuAction[];
  onAction?: (fileId: string, actionId: string) => void;
}) {
  const palette = useSettingsPalette();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const label = `More actions for ${file.name}`;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <HoverTooltip label="More actions">
        <DropdownMenuTrigger asChild label={label} style={CENTERED}>
          <Pressable
            role="button"
            accessibilityLabel={label}
            aria-expanded={open}
            accessibilityState={{ expanded: open }}
            {...webDataSet({ bloomSettingsPress: '', ringOffset: '' })}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[
              styles.moreTrigger,
              {
                borderColor: open ? palette.borderButtonActive : hovered ? palette.borderButtonHover : palette.borderButton,
                backgroundColor: open ? palette.primaryActive : hovered ? palette.primaryHover : palette.primary,
                boxShadow: palette.shadowXs,
              },
            ]}
          >
            <RiMore2Fill width={16} height={16} fill={palette.iconPrimary} />
          </Pressable>
        </DropdownMenuTrigger>
      </HoverTooltip>
      <DropdownMenuContent label={label} align="end" minWidth={200} maxWidth={200}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            leading={action.icon ? <action.icon width={18} height={18} fill={palette.iconSecondary} /> : undefined}
            onPress={() => onAction?.(file.id, action.id)}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type RowPhase = 'idle' | 'entering' | 'exiting';

/**
 * `AnimatedRow`: a grid track growing 0 → row height while the
 * content slides down from −100% (400ms ease-out, fade 240ms); the exit is the
 * structural reverse (225ms ease-in, fade 160ms).
 */
function AnimatedRow({ phase, onExited, children }: { phase: RowPhase; onExited: () => void; children: ReactNode }) {
  const reducedMotion = useReducedMotion();
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
      height: progress.value >= 1 || measured.value === 0 ? 'auto' : progress.value * measured.value,
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
    <Animated.View style={outer}>
      <Animated.View
        style={inner}
        onLayout={(event) => {
          if (measured.value === 0 || progress.value >= 1) measured.value = event.nativeEvent.layout.height;
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

function defaultStoredIcon(kind: string, palette: SettingsPalette): ReactNode {
  const Icon = kind === 'spreadsheet' ? RiFileExcel2Line : kind === 'video' ? RiVideoLine : RiFileTextLine;
  return <Icon width={24} height={24} fill={palette.iconSecondary} />;
}

function ToolbarSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: SettingsFileKind[];
}) {
  // The select hands over either the stored item or its raw value, by platform.
  const labelFor = (v: unknown) => {
    const key = typeof v === 'object' && v !== null && 'value' in v ? (v as SettingsFileKind).value : v;
    return items.find((item) => item.value === key)?.label ?? String(key);
  };
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger label={label}>
        <SelectValue>{labelFor}</SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label={label}
        items={items}
        valueExtractor={(item) => item.value}
        renderItem={(item) => (
          <SelectItem value={item.value} label={item.label}>
            <SelectItemIndicator />
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

// ---------------------------------------------------------------------------
//  Page
// ---------------------------------------------------------------------------

const DEFAULT_KINDS: SettingsFileKind[] = [
  { value: 'document', label: 'Documents' },
  { value: 'spreadsheet', label: 'Spreadsheets' },
  { value: 'video', label: 'Videos' },
];

const ORDER_ITEMS: SettingsFileKind[] = [
  { value: 'newest', label: 'Modified' },
  { value: 'oldest', label: 'Oldest first' },
];

export function SettingsStoragePage({
  files,
  kinds = DEFAULT_KINDS,
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  pageSize = 6,
  onDeleteFile,
  fileActions = DEFAULT_FILE_ACTIONS,
  onFileAction,
  renderFileIcon,
  upload,
  style,
  testID,
}: SettingsStoragePageProps) {
  useSettingsWebCss();
  const palette = useSettingsPalette();
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
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = files.filter(
      (f) => (kindFilter === 'all' || f.kind === kindFilter) && (q === '' || f.name.toLowerCase().includes(q)),
    );
    if (sort) {
      const { key, dir } = sort;
      rows.sort((a, b) => {
        const cmp = key === 'name' ? a.name.localeCompare(b.name) : key === 'size' ? a.size - b.size : a.uploadedAt - b.uploadedAt;
        return dir === 'asc' ? cmp : -cmp;
      });
    } else {
      rows.sort((a, b) => (recency === 'newest' ? b.uploadedAt - a.uploadedAt : a.uploadedAt - b.uploadedAt));
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

  const typeItems = useMemo(() => [{ value: 'all', label: 'File type' }, ...kinds], [kinds]);

  return (
    <View testID={testID} style={[styles.page, settingsRingVars(palette), style]}>
      <FileUpload
        {...upload}
        testID={testID ? `${testID}-dropzone` : undefined}
      />

      <View style={[styles.table, { borderColor: palette.separator }]} testID={testID ? `${testID}-table` : undefined}>
        <View style={styles.toolbar}>
          <View>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
              Stored in
            </Text>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
              {filtered.length.toLocaleString()} files
            </Text>
          </View>
          <View style={[styles.tools, compact ? styles.toolsCompact : null]}>
            <ToolbarSelect
              label="Filter by file type"
              value={kindFilter}
              onChange={(v) => {
                setKindFilter(v);
                setPage(1);
              }}
              items={typeItems}
            />
            <ToolbarSelect
              label="Order by"
              value={recency}
              onChange={(v) => {
                setRecency(v === 'oldest' ? 'oldest' : 'newest');
                setSort(null);
                setPage(1);
              }}
              items={ORDER_ITEMS}
            />
            <View style={[styles.search, compact ? styles.searchCompact : null]}>
              <TextField radius={borderRadius.full}>
                <TextFieldIcon icon={RiSearchLine} />
                <TextFieldInput
                  label="Search files"
                  placeholder="Search"
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

        <View
          style={[
            styles.headerRow,
            { borderColor: palette.separator, backgroundColor: palette.secondary },
          ]}
        >
          <View style={styles.nameCell}>
            <Checkbox
              checked={allOnPage}
              indeterminate={someOnPage}
              onCheckedChange={toggleAll}
              accessibilityLabel="Select all files on this page"
            />
            <SortableHeader label="File name" sortKey="name" sort={sort} onSort={onSort} />
          </View>
          {compact ? null : (
            <>
              <View style={[styles.cell, styles.dateCol]}>
                <SortableHeader label="Uploaded on" sortKey="uploadedAt" sort={sort} onSort={onSort} />
              </View>
              <View style={[styles.cell, styles.sizeCol]}>
                <SortableHeader label="File size" sortKey="size" sort={sort} onSort={onSort} />
              </View>
            </>
          )}
          <View style={[styles.cell, compact ? null : styles.actionsCol]}>
            <Text variant="body-medium" numberOfLines={1} style={{ color: palette.textTertiary }}>
              Actions
            </Text>
          </View>
        </View>

        <View style={styles.rows}>
          {rows.length > 0 ? (
            rows.map((file) => (
              <AnimatedRow
                key={file.id}
                phase={exiting.has(file.id) ? 'exiting' : entering.has(file.id) ? 'entering' : 'idle'}
                onExited={() => finishDelete(file.id)}
              >
                <View
                  pointerEvents={exiting.has(file.id) ? 'none' : 'auto'}
                  style={[styles.row, { borderBottomColor: palette.separator }]}
                  testID={testID ? `${testID}-row-${file.id}` : undefined}
                >
                  <View style={styles.nameCell}>
                    <Checkbox
                      checked={selectedSet.has(file.id)}
                      onCheckedChange={(on) => toggleRow(file.id, on)}
                      accessibilityLabel={`Select ${file.name}`}
                    />
                    <View style={styles.fileName2}>
                      {renderFileIcon ? renderFileIcon(file) : defaultStoredIcon(file.kind, palette)}
                      <Text variant="body-medium" numberOfLines={1} style={[styles.shrink, { color: palette.text }]}>
                        {file.name}
                      </Text>
                    </View>
                  </View>
                  {compact ? null : (
                    <>
                      <View style={[styles.cell, styles.dateCol]}>
                        <Text variant="body-medium" numberOfLines={1} style={{ color: palette.text }}>
                          {file.uploadedOn}
                        </Text>
                      </View>
                      <View style={[styles.cell, styles.sizeCol]}>
                        <Chip size="lg" style={{ backgroundColor: palette.secondary }} textStyle={{ color: palette.text }}>
                          {file.sizeLabel ?? formatFileSize(file.size)}
                        </Chip>
                      </View>
                    </>
                  )}
                  <View style={[styles.cell, compact ? null : styles.actionsCol, styles.actions]}>
                    <HoverTooltip label="Delete file">
                      <Button size="sm" icon={RiDeleteBin6Line} accessibilityLabel={`Delete ${file.name}`} onPress={() => deleteFile(file.id)} appearance="plain" tone="neutral" />
                    </HoverTooltip>
                    <RowMoreMenu file={file} actions={fileActions} onAction={onFileAction} />
                  </View>
                </View>
              </AnimatedRow>
            ))
          ) : (
            <View style={styles.empty}>
              <Text variant="body-medium" style={{ color: palette.textTertiary }}>
                No files match your filters.
              </Text>
            </View>
          )}
        </View>

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
  headerRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingLeft: 12,
  },
  nameCell: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 10,
  },
  cell: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  dateCol: { width: 150 },
  sizeCol: { width: 104 },
  actionsCol: { width: 116 },
  actions: {
    justifyContent: 'flex-end',
    gap: 10,
  },
  sortable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 4,
  },
  caret: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caretUp: {
    transform: [{ rotate: '180deg' }],
  },
  rows: {
    paddingLeft: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  fileName2: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shrink: {
    flexShrink: 1,
  },
  moreTrigger: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
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

/** Trigger slots default to `alignSelf: flex-start`; these sit centred in their row. */
const CENTERED = { alignSelf: 'center' } as const;
