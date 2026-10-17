import { useTemplateCopy } from '../template-copy';
import type { ReactNode } from 'react';
import { RiEqualizerLine, RiSideBarLine, RiSortDesc } from '../icons/remix';
import { StyledView, StyledPressable } from '../styles/styled-primitives';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { useProjectBoardPlatform } from './context';
import type { BoardSort, TicketPriority } from './types';

export const PRIORITIES: readonly TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export function PropertySelect({ label, value, options, onChange, leading }: {
  label: string; value: string; options: readonly { id: string; label: string }[];
  onChange: (value: string) => void; leading?: ReactNode;
}) {
  const localize = useTemplateCopy();
  const { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectItemText, SelectItemIndicator } = useProjectBoardPlatform();
  return localize((<Select size="sm" value={value} onValueChange={onChange}>
    <SelectTrigger label={label} fieldStyle={{ borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 4, paddingRight: 4 }}><SelectValue leading={leading} placeholder={label} /></SelectTrigger>
    <SelectContent label={label} items={options} valueExtractor={item => item.id} width={220} renderItem={item => <SelectItem value={item.id} label={item.label}><SelectItemText>{item.label}</SelectItemText><SelectItemIndicator /></SelectItem>} />
  </Select>));
}

export function ProjectBoardControls({ sort, onSort, priority, onPriority, project, onProject, projects, showDone, onShowDone, fillColumns, onFillColumns }: {
  sort: BoardSort; onSort: (sort: BoardSort) => void;
  priority: TicketPriority | 'all'; onPriority: (priority: TicketPriority | 'all') => void;
  project: string; onProject: (project: string) => void; projects: readonly string[];
  showDone: boolean; onShowDone: (show: boolean) => void;
  fillColumns: boolean; onFillColumns: (fill: boolean) => void;
}) {
  const localize = useTemplateCopy();
  const { colors } = useTheme();
  const { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel } = useProjectBoardPlatform();
  const filtered = priority !== 'all' || project !== 'all';
  const trigger = (label: string, icon: ReactNode, active = false) => <DropdownMenuTrigger asChild><StyledPressable accessibilityLabel={label} className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
    {icon}{active && <StyledView className="absolute -top-0.5 -end-0.5 size-2 rounded-full" style={{ backgroundColor: colors.primary }} />}
  </StyledPressable></DropdownMenuTrigger>;
  return localize((<StyledView className="flex flex-row items-center gap-2" accessibilityLabel="Board controls">
    <DropdownMenu>
      {trigger('Sort tickets', <RiSortDesc width={20} height={20} fill={colors.icon} />, sort !== 'manual')}
      <DropdownMenuContent label="Sort tickets" style={{ width: 220 }}>
        {([{ id: 'manual', label: 'Manual order' }, { id: 'priority', label: 'Priority' }, { id: 'title', label: 'Title' }] as const).map(option => <DropdownMenuItem key={option.id} onPress={() => onSort(option.id)}><Text variant="body-medium">{option.label}{sort === option.id ? ' ✓' : ''}</Text></DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
    <DropdownMenu>
      {trigger('Filter tickets', <RiEqualizerLine width={20} height={20} fill={colors.icon} />, filtered)}
      <DropdownMenuContent label="Filter tickets" style={{ width: 220 }}>
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        {(['all', ...PRIORITIES] as const).map(value => <DropdownMenuItem key={value} onPress={() => onPriority(value)}>{value === 'all' ? 'All priorities' : value}{priority === value ? ' ✓' : ''}</DropdownMenuItem>)}
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        {['all', ...projects].map(value => <DropdownMenuItem key={value} onPress={() => onProject(value)}>{value === 'all' ? 'All projects' : value}{project === value ? ' ✓' : ''}</DropdownMenuItem>)}
        {filtered && <DropdownMenuItem onPress={() => { onPriority('all'); onProject('all'); }}>Clear filters</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
    <DropdownMenu>
      {trigger('Display options', <RiSideBarLine width={20} height={20} fill={colors.icon} />)}
      <DropdownMenuContent label="Display options" style={{ width: 220 }}>
        <DropdownMenuCheckboxItem checked={showDone} onCheckedChange={onShowDone}>Show done column</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={fillColumns} onCheckedChange={onFillColumns}>Fill wide screens</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </StyledView>));
}
