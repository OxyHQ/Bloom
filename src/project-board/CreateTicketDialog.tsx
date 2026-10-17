import { useTemplateCopy } from '../template-copy';
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import { Avatar } from '../avatar';
import { Switch } from '../switch';
import { Textarea } from '../textarea';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { useDialogControl } from '../dialog/context';
import { useProjectBoardPlatform } from './context';
import { PRIORITIES, PropertySelect } from './ProjectBoardControls';
import type { NewProjectTicket, ProjectColumn, ProjectMember, TicketPriority } from './types';

export function CreateTicketDialog({ title: boardTitle, initialColumnId, columns, code, projects, members, onClose, onCreate }: {
  title: string; initialColumnId?: string; columns: ProjectColumn[]; code: string;
  projects: readonly string[]; members: Readonly<Record<string, ProjectMember>>;
  onClose: () => void; onCreate: (ticket: NewProjectTicket) => void;
}) {
  const localize = useTemplateCopy();
  const { Button, CloseButton, Dialog } = useProjectBoardPlatform();
  const control = useDialogControl();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(initialColumnId ?? columns.find(column => column.id === 'todo')?.id ?? columns[0]?.id ?? '');
  const [priority, setPriority] = useState<TicketPriority>('Low');
  const [assignee, setAssignee] = useState('');
  const [project, setProject] = useState(projects[0] ?? 'Bloom');
  const [keepCreating, setKeepCreating] = useState(false);
  const titleRef = useRef<TextInput>(null);
  const member = members[assignee];
  function submit() {
    if (!title.trim() || !columns.some(column => column.id === columnId)) { titleRef.current?.focus(); return; }
    onCreate({ title: title.trim(), description: description.trim(), columnId, priority, project, assignees: member ? [member.id] : [] });
    if (keepCreating) { setTitle(''); setDescription(''); titleRef.current?.focus(); }
    else control.close();
  }
  return localize((<Dialog control={control} startOpen label="Create ticket" placement={{ base: 'bottom', md: 'center' }} maxWidth={560} contentPadding={16} onClose={onClose}>
    <StyledView className="flex flex-col gap-12">
      <StyledView className="flex flex-col gap-2.5">
        <StyledView className="flex flex-row items-start justify-between gap-3">
          <Text variant="caption-1-medium" style={{ color: colors.textSecondary, flex: 1 }}>{boardTitle} › {code} › New ticket</Text>
          <CloseButton size="sm" accessibilityLabel="Close create ticket" onPress={() => control.close()} />
        </StyledView>
        <StyledView className="flex flex-col gap-1.5">
          <Textarea inputRef={titleRef} accessibilityLabel="Ticket title" value={title} onChangeText={setTitle} maxLength={200} rows={1} autoResize maxRows={4} placeholder="Enter ticket title" required autoFocus />
          <Textarea accessibilityLabel="Description" value={description} onChangeText={setDescription} maxLength={5000} rows={1} autoResize maxRows={8} placeholder="Description area" />
        </StyledView>
      </StyledView>
      <StyledView className="flex flex-col gap-3">
        <StyledView className="flex flex-row flex-wrap items-center gap-x-4 gap-y-3">
          <PropertySelect label="Status" value={columnId} onChange={setColumnId} options={columns.map(column => ({ id: column.id, label: column.title }))} />
          <PropertySelect label="Priority" value={priority} onChange={value => setPriority(value as TicketPriority)} options={PRIORITIES.map(value => ({ id: value, label: value }))} />
          <PropertySelect label="Assignee" value={assignee} onChange={setAssignee} leading={member ? <Avatar source={member.avatar} initials={member.initials} alt={member.name} size={18} /> : undefined} options={[{ id: '', label: 'Unassigned' }, ...Object.values(members).map(person => ({ id: person.id, label: person.name }))]} />
          <PropertySelect label="Project" value={project} onChange={setProject} options={projects.map(value => ({ id: value, label: value }))} />
        </StyledView>
        <StyledView className="flex flex-row items-center justify-between gap-3">
          <StyledView className="flex flex-row items-center gap-2"><Switch value={keepCreating} onValueChange={setKeepCreating} accessibilityLabel="Create more tickets" size="sm" /><Text variant="body-medium" style={{ color: colors.textSecondary }}>Create more</Text></StyledView>
          <Button size="small" onPress={submit} disabled={!title.trim() || !columnId} testID="project-board-create-submit">Create ticket</Button>
        </StyledView>
      </StyledView>
    </StyledView>
  </Dialog>));
}
