import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiEqualizerLine } from '../icons/remix/RiEqualizerLine';
import { RiSideBarLine } from '../icons/remix/RiSideBarLine';
import { RiSortDesc } from '../icons/remix/RiSortDesc';
import { useMessages } from '../locale/messages';
import { IS_WEB } from '../styles/platform';
import { ROUNDED_FULL } from '../styles/rounded-full';
import { webDataSet } from '../styles/web-data';
import { createTokenStyles } from '../theme/color-tokens';
import { Text } from '../typography';
import { BoardTooltip } from './BoardTooltip';
import { PRIORITIES } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { TAILWIND_SHADOW, TYPE, useBoardText } from './styles';
import { useProjectBoardWebCss } from './web-css';
import type { BoardSort, TicketPriority } from './types';
export { PRIORITIES } from './constants';

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  /**
   * A menu panel's width. Its `rounded-[14px] p-1` lost to the panel's own
   * chrome, and the panel keeps its own width on the web.
   */
  menu: { width: 220 },
  // A menu or select row (`rounded-2lg px-2 text-body-medium`); its `py-1.5`
  // lost to the row's own 4px.
  row: { borderRadius: 10, paddingInline: 8, ...TYPE.body },
  option: { paddingInline: 8, ...TYPE.body },
  rowLabel: { flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
  check: { width: 16, height: 16 },
  icon: { width: 20, height: 20 },
  section: { paddingInline: 8, paddingTop: 8, paddingBottom: 4 },
});

const useStyles = createTokenStyles((t) => ({
  /** The 36px bordered square of a control menu; its web fill and hover are the sheet's. */
  trigger: {
    position: 'relative',
    flexDirection: 'row',
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: t.border,
    color: t.foreground,
    ...(IS_WEB
      ? null
      : {
          backgroundColor: t.card,
          boxShadow: [
            { offsetX: 0, offsetY: 1, blurRadius: 2, spreadDistance: 0, color: '#0000000d' },
          ],
        }),
  },
  /** The accent dot on an active control, ringed in the page's fill. */
  dot: {
    position: 'absolute',
    insetInlineEnd: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: ROUNDED_FULL,
    backgroundColor: t.primary,
    boxShadow: IS_WEB
      ? TAILWIND_SHADOW(`0 0 0 2px ${t.background}`, '0 0 #0000')
      : [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 2, color: t.background }],
  },
  /** A property's value as a borderless select trigger (`bg-transparent`, `shadow-none`). */
  property: {
    width: 'auto',
    justifyContent: 'flex-start',
    borderRadius: 6,
    borderStyle: 'solid',
    borderWidth: 0,
    ...TYPE.body,
    ...(IS_WEB
      ? { boxShadow: TAILWIND_SHADOW('0 0 #0000', '0 0 #0000') }
      : { backgroundColor: '#0000', boxShadow: [] }),
  },
  propertyCreate: { padding: 0, color: t.mutedForeground },
  propertyEdit: { minWidth: 0, padding: 4, color: t.foreground },
}));
export function PropertySelect({
  label,
  value,
  options,
  onChange,
  renderValue,
  leading,
  create = false,
  chip = false,
}: {
  label: string;
  value: string;
  options: readonly {
    id: string;
    label: string;
    icon?: ReactNode;
    hideLabel?: boolean;
  }[];
  onChange: (v: string) => void;
  renderValue?: ReactNode;
  leading?: ReactNode;
  create?: boolean;
  chip?: boolean;
}) {
  const {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectItemText,
    SelectItemIndicator,
  } = useProjectBoardPlatform();
  useProjectBoardWebCss();
  const own = useStyles();
  return (
    <Select size="sm" value={value} onValueChange={onChange}>
      <SelectTrigger asChild label={label}>
        <Pressable
          accessibilityLabel={label}
          // A pill's own fill answers a hover; any other value takes the row's.
          {...webDataSet({ bloomBoardProperty: chip ? 'chip' : '' })}
          style={[
            own.property,
            create ? own.propertyCreate : own.propertyEdit,
            {
              flexShrink: 0,
              flexDirection: 'row',
              margin: create ? 0 : -4,
            },
          ]}
        >
          {renderValue ?? <SelectValue leading={leading} placeholder={label} />}
        </Pressable>
      </SelectTrigger>
      <SelectContent
        label={label}
        items={options}
        valueExtractor={(item) => item.id}
        width={220}
        renderItem={(item) => (
          <SelectItem value={item.id} label={item.label} style={styles.option}>
            {item.icon}
            {!item.hideLabel && <SelectItemText>{item.label}</SelectItemText>}
            <SelectItemIndicator />
          </SelectItem>
        )}
      />
    </Select>
  );
}
export function ProjectBoardControls({
  sort,
  onSort,
  priority,
  onPriority,
  project,
  onProject,
  projects,
  showDone,
  onShowDone,
  fillColumns,
  onFillColumns,
}: {
  sort: BoardSort;
  onSort: (s: BoardSort) => void;
  priority: TicketPriority | 'all';
  onPriority: (p: TicketPriority | 'all') => void;
  project: string;
  onProject: (p: string) => void;
  projects: readonly string[];
  showDone: boolean;
  onShowDone: (v: boolean) => void;
  fillColumns: boolean;
  onFillColumns: (v: boolean) => void;
}) {
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
  } = useProjectBoardPlatform();
  useProjectBoardWebCss();
  const own = useStyles();
  const text = useBoardText();
  const filtered = priority !== 'all' || project !== 'all';
  const trigger = (label: string, icon: ReactNode, active = false) => (
    <BoardTooltip label={label}>
      <DropdownMenuTrigger asChild>
        <Pressable
          accessibilityLabel={label}
          style={own.trigger}
          {...webDataSet({ bloomBoardTrigger: '' })}
        >
          {icon}
          {active && <View style={own.dot} />}
        </Pressable>
      </DropdownMenuTrigger>
    </BoardTooltip>
  );
  const option = (label: string, selected: boolean, run: () => void, key: string) => (
    <DropdownMenuItem key={key} onPress={run} style={styles.row}>
      <Text style={[styles.rowLabel, text.body]}>{label}</Text>
      {selected && <RiCheckLine style={styles.check} />}
    </DropdownMenuItem>
  );
  return (
    <View style={styles.controls} accessibilityLabel={m.controls}>
      <DropdownMenu>
        {trigger(m.sortTickets, <RiSortDesc style={styles.icon} />, sort !== 'manual')}
        <DropdownMenuContent label={m.sortTickets} style={styles.menu}>
          {(
            [
              { id: 'manual', label: m.manualOrder },
              { id: 'priority', label: m.priority },
              { id: 'title', label: m.title },
            ] as const
          ).map((o) => option(o.label, sort === o.id, () => onSort(o.id), o.id))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        {trigger(m.filterTickets, <RiEqualizerLine style={styles.icon} />, filtered)}
        <DropdownMenuContent label={m.filterTickets} style={styles.menu}>
          <Text style={[styles.section, text.captionMuted]}>{m.priority}</Text>
          {(['all', ...PRIORITIES] as const).map((v) =>
            option(
              v === 'all' ? m.allPriorities : m.priorityLabels[v],
              priority === v,
              () => onPriority(v),
              v,
            ),
          )}
          <Text style={[styles.section, text.captionMuted]}>{m.project}</Text>
          {['all', ...projects].map((v) =>
            option(v === 'all' ? m.allProjects : v, project === v, () => onProject(v), v),
          )}
          {filtered && (
            <DropdownMenuItem
              style={styles.row}
              onPress={() => {
                onPriority('all');
                onProject('all');
              }}
            >
              {m.clearFilters}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        {trigger(m.displayOptions, <RiSideBarLine style={styles.icon} />)}
        <DropdownMenuContent label={m.displayOptions} style={styles.menu}>
          <DropdownMenuCheckboxItem
            style={styles.row}
            checked={showDone}
            onCheckedChange={onShowDone}
          >
            {m.showDone}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            style={styles.row}
            checked={fillColumns}
            onCheckedChange={onFillColumns}
          >
            {m.fillScreens}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
}
