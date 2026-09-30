import type { ReactNode } from 'react';
import { useMessages } from '../locale/messages';
import { BoardTooltip } from './BoardTooltip';
import { PRIORITIES, cx } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import {
  SourcePressable as Pressable,
  RiCheckLine,
  RiEqualizerLine,
  RiSideBarLine,
  RiSortDesc,
  SourceText as Text,
  SourceView as View,
} from './SourcePrimitives';
import type { BoardSort, TicketPriority } from './types';
export { PRIORITIES } from './constants';
const TRIGGER =
  'relative flex size-9 shrink-0 items-center justify-center rounded-2lg border border-border-button-default bg-background-primary-default text-foreground-icon-primary shadow-xs transition-colors hover:border-border-button-hover hover:bg-background-primary-hover';
const MENU = 'w-[220px] rounded-[14px] p-1';
const ROW = 'rounded-2lg px-2 py-1.5 text-body-medium';
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
  return (
    <Select size="sm" value={value} onValueChange={onChange}>
      <SelectTrigger asChild label={label}>
        <Pressable
          accessibilityLabel={label}
          className={
            create
              ? 'w-auto justify-start rounded-md border-0 bg-transparent p-0 text-body-medium text-text-secondary shadow-none hover:bg-background-primary-hover [&>svg]:hidden'
              : cx(
                  'w-auto min-w-0 justify-start rounded-md border-0 bg-transparent p-1 text-body-medium text-text-primary shadow-none [&>svg]:hidden',
                  chip
                    ? 'group/priority hover:bg-transparent'
                    : 'hover:bg-background-primary-hover',
                )
          }
          style={{
            flexShrink: 0,
            flexDirection: 'row',
            margin: create ? 0 : -4,
          }}
        >
          {renderValue ?? <SelectValue leading={leading} placeholder={label} />}
        </Pressable>
      </SelectTrigger>
      <SelectContent
        label={label}
        className={
          create ? 'z-[110] w-[220px]' : 'z-[120] w-[220px] rounded-[14px] p-1'
        }
        items={options}
        valueExtractor={(item) => item.id}
        width={220}
        renderItem={(item) => (
          <SelectItem
            value={item.id}
            label={item.label}
            className="px-2 py-1.5 text-body-medium"
          >
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
  const filtered = priority !== 'all' || project !== 'all';
  const trigger = (label: string, icon: ReactNode, active = false) => (
    <BoardTooltip label={label}>
      <DropdownMenuTrigger asChild>
        <Pressable accessibilityLabel={label} className={TRIGGER}>
          {icon}
          {active && (
            <View className="absolute -top-0.5 -end-0.5 size-2 rounded-full bg-accent-500 ring-2 ring-background-full" />
          )}
        </Pressable>
      </DropdownMenuTrigger>
    </BoardTooltip>
  );
  const option = (
    label: string,
    selected: boolean,
    run: () => void,
    key: string,
  ) => (
    <DropdownMenuItem key={key} onPress={run} className={ROW}>
      <Text className="flex-1 text-body-medium text-text-primary">{label}</Text>
      {selected && <RiCheckLine className="size-4" />}
    </DropdownMenuItem>
  );
  return (
    <View className="flex items-center gap-2" accessibilityLabel={m.controls}>
      <DropdownMenu>
        {trigger(
          m.sortTickets,
          <RiSortDesc className="size-5" />,
          sort !== 'manual',
        )}
        <DropdownMenuContent
          label={m.sortTickets}
          className={MENU}
          style={{ width: 220 }}
        >
          {(
            [
              { id: 'manual', label: m.manualOrder },
              { id: 'priority', label: m.priority },
              { id: 'title', label: m.title },
            ] as const
          ).map((o) =>
            option(o.label, sort === o.id, () => onSort(o.id), o.id),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        {trigger(
          m.filterTickets,
          <RiEqualizerLine className="size-5" />,
          filtered,
        )}
        <DropdownMenuContent
          label={m.filterTickets}
          className={MENU}
          style={{ width: 220 }}
        >
          <Text className="px-2 pt-2 pb-1 text-body-2-medium text-text-tertiary">
            {m.priority}
          </Text>
          {(['all', ...PRIORITIES] as const).map((v) =>
            option(
              v === 'all' ? m.allPriorities : v,
              priority === v,
              () => onPriority(v),
              v,
            ),
          )}
          <Text className="px-2 pt-2 pb-1 text-body-2-medium text-text-tertiary">
            {m.project}
          </Text>
          {['all', ...projects].map((v) =>
            option(
              v === 'all' ? m.allProjects : v,
              project === v,
              () => onProject(v),
              v,
            ),
          )}
          {filtered && (
            <DropdownMenuItem
              className={ROW}
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
        {trigger(m.displayOptions, <RiSideBarLine className="size-5" />)}
        <DropdownMenuContent
          label={m.displayOptions}
          className={MENU}
          style={{ width: 220 }}
        >
          <DropdownMenuCheckboxItem
            className={ROW}
            checked={showDone}
            onCheckedChange={onShowDone}
          >
            {m.showDone}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            className={ROW}
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
