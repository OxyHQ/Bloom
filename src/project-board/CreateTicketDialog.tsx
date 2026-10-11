import { useRef, useState, type ComponentType, type ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  useWindowDimensions,
  type ScrollViewProps,
  type TextInput,
} from 'react-native';
import { styled } from 'react-native-css';
import { useDialogControl } from '../dialog/context';
import { useMessages } from '../locale/messages';
import { Switch } from '../switch';
import { Textarea } from '../textarea';
import { DEFAULT_PROJECT, PRIORITIES } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { PropertySelect } from './ProjectBoardControls';
import { TicketAssigneeIcon, TicketStatusIcon, TicketUrgencyIcon } from './ProjectBoardIcons';
import {
  SourceAvatar as Avatar,
  SourceChip as Chip,
  RiAddFill,
  RiArrowRightSLine,
  RiFolder6Line,
  SourceText as Text,
  SourceView as View,
} from './SourcePrimitives';
import type { NewProjectTicket, ProjectColumn, ProjectMember, TicketPriority } from './types';
const PRIORITY_STYLES = {
  Low: 'bg-indigo-200 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  Medium: 'bg-status-yellow-background text-status-yellow-text',
  High: 'bg-status-orange-background text-status-orange-text',
  Urgent: 'bg-status-rose-background text-status-rose-text',
};
const ScrollBodyBase: ComponentType<Pick<ScrollViewProps, 'style' | 'contentContainerStyle'>> =
  ScrollView;
const StyledScrollView: ComponentType<ScrollViewProps> = styled(ScrollBodyBase, {
  className: 'style',
});

function TicketFormBody({ children }: { children: ReactNode }) {
  const { height } = useWindowDimensions();
  if (Platform.OS === 'web')
    return (
      <View className="max-h-[calc(100dvh-56px)] overflow-y-auto rounded-3xl bg-background-primary-default p-4 outline-none">
        {children}
      </View>
    );
  return (
    <StyledScrollView
      className="rounded-3xl bg-background-primary-default"
      testID="project-board-create-scroll"
      style={{ maxHeight: height - 56, flexGrow: 0, flexShrink: 1 }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {children}
    </StyledScrollView>
  );
}
export function CreateTicketDialog({
  title: boardTitle,
  initialColumnId,
  columns,
  code,
  projects,
  members,
  onClose,
  onCreate,
}: {
  title: string;
  initialColumnId?: string;
  columns: ProjectColumn[];
  code: string;
  projects: readonly string[];
  members: Readonly<Record<string, ProjectMember>>;
  onClose: () => void;
  onCreate: (ticket: NewProjectTicket) => void;
}) {
  const { messages: m } = useMessages(PROJECT_BOARD_MESSAGES);
  const { Button, CloseButton, Dialog, TicketGenieSurface } = useProjectBoardPlatform();
  const control = useDialogControl();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState<string | null>(initialColumnId ?? null);
  const [priority, setPriority] = useState<TicketPriority | null>(null);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [project, setProject] = useState<string | null>(null);
  const [keepCreating, setKeepCreating] = useState(false);
  const titleRef = useRef<TextInput>(null);
  const member = assignee ? members[assignee] : undefined;
  const selectedColumn = columns.find((column) => column.id === columnId);
  const priorityChip = (value: TicketPriority) => (
    <Chip className={`px-[7px] py-[3px] ${PRIORITY_STYLES[value]}`}>{value}</Chip>
  );
  function submit() {
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    onCreate({
      title: title.trim(),
      description: description.trim(),
      columnId: columnId ?? columns.find((c) => c.id === 'todo')?.id ?? columns[0]?.id ?? 'todo',
      priority: priority ?? PRIORITIES[0]!,
      project:
        project ?? projects.find((p) => p === DEFAULT_PROJECT) ?? projects[0] ?? DEFAULT_PROJECT,
      assignees: member ? [member.id] : [],
    });
    if (keepCreating) {
      setTitle('');
      setDescription('');
      titleRef.current?.focus();
    } else control.close();
  }
  return (
    <Dialog
      control={control}
      startOpen
      onClose={onClose}
      label={m.createTicket}
      presentation="custom"
      exitDuration={480}
      placement="center"
      width={560}
      maxWidth={560}
      contentPadding={0}
      scrollable={false}
      morph={false}
      containerClassName="fixed inset-0 z-100 flex items-end justify-center overflow-clip px-4 pt-4 pb-10"
      containerStyle={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 40,
      }}
      panelStyle={{
        position: 'relative',
        top: undefined,
        bottom: undefined,
        left: undefined,
        right: undefined,
        width: '100%',
        maxWidth: 560,
        backgroundColor: 'transparent',
      }}
    >
      <View className="w-[560px] max-w-full outline-none" style={{ width: '100%' }}>
        <TicketGenieSurface>
          <TicketFormBody>
            <View className="flex flex-col gap-12">
              <View className="flex flex-col gap-2.5">
                <View className="flex items-start justify-between gap-3">
                  <View className="flex min-w-0 items-center gap-0.5 text-body-2-medium text-text-secondary">
                    <Text className="truncate text-body-2-medium text-text-secondary">
                      {boardTitle}
                    </Text>
                    <RiArrowRightSLine className="size-[15px] shrink-0 text-foreground-icon-tertiary rtl:rotate-180" />
                    <Text className="text-body-2-medium text-text-secondary">{code}</Text>
                    <RiArrowRightSLine className="size-[15px] shrink-0 text-foreground-icon-tertiary rtl:rotate-180" />
                    <Text className="whitespace-nowrap text-body-2-medium text-text-secondary">
                      {m.newTicket}
                    </Text>
                  </View>
                  <CloseButton
                    size="sm"
                    accessibilityLabel={m.closeCreate}
                    onPress={() => control.close()}
                  />
                </View>
                <View className="flex flex-col gap-1.5">
                  <Textarea
                    className="relative grid text-headline-medium text-text-primary"
                    inputRef={titleRef}
                    accessibilityLabel={m.ticketTitle}
                    value={title}
                    onValueChange={setTitle}
                    required
                    autoFocus
                    rows={1}
                    maxLength={200}
                    autoResize
                    maxRows={8}
                    placeholder={m.enterTitle}
                    fieldClassName="relative border-0 bg-transparent p-0"
                    inputClassName="size-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-text-secondary text-headline-medium text-text-primary"
                    inputStyle={{ minHeight: 22 }}
                  />
                  <Textarea
                    className="relative grid max-h-[200px] text-body-medium text-text-secondary max-sm:text-[16px]"
                    accessibilityLabel={m.description}
                    value={description}
                    onValueChange={setDescription}
                    rows={1}
                    maxLength={5000}
                    autoResize
                    maxRows={10}
                    placeholder={m.descriptionArea}
                    fieldClassName="relative border-0 bg-transparent p-0"
                    inputClassName="size-full resize-none border-0 bg-transparent p-0 outline-none placeholder:text-text-tertiary text-body-medium text-text-secondary max-sm:text-[16px]"
                  />
                </View>
              </View>
              <View className="flex flex-col gap-3">
                <View className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <PropertySelect
                    create
                    label={m.status}
                    value={columnId ?? ''}
                    onChange={setColumnId}
                    renderValue={
                      <View className="flex items-center gap-1.5">
                        {selectedColumn ? (
                          <>
                            <TicketStatusIcon status={selectedColumn.id} />
                            <Text className="text-body-medium text-text-secondary">
                              {selectedColumn.title}
                            </Text>
                          </>
                        ) : (
                          <>
                            <RiAddFill className="size-5 text-foreground-icon-tertiary" />
                            <Text className="text-body-medium text-text-tertiary">{m.status}</Text>
                          </>
                        )}
                      </View>
                    }
                    options={columns.map((c) => ({
                      id: c.id,
                      label: c.title,
                      icon: (
                        <TicketStatusIcon
                          status={c.id}
                          className="text-foreground-icon-secondary"
                        />
                      ),
                    }))}
                  />
                  <PropertySelect
                    create
                    label={m.urgency}
                    value={priority ?? ''}
                    onChange={(v) => setPriority(v as TicketPriority)}
                    renderValue={
                      priority ? (
                        priorityChip(priority)
                      ) : (
                        <View className="flex items-center gap-1.5">
                          <TicketUrgencyIcon className="size-[18px] text-foreground-icon-tertiary" />
                          <Text className="text-body-medium text-text-tertiary">{m.urgency}</Text>
                        </View>
                      )
                    }
                    options={PRIORITIES.map((v) => ({
                      id: v,
                      label: v,
                      icon: priorityChip(v),
                      hideLabel: true,
                    }))}
                  />
                  <PropertySelect
                    create
                    label={m.assignee}
                    value={assignee ?? ''}
                    onChange={setAssignee}
                    renderValue={
                      <View className="flex items-center gap-1.5">
                        {member ? (
                          <>
                            <Avatar
                              source={member.avatar}
                              initials={member.initials}
                              className="size-[18px]"
                            />
                            <Text className="text-body-medium text-text-secondary">
                              {member.name.split(' ')[0]} {member.name.split(' ')[1]?.[0]}.
                            </Text>
                          </>
                        ) : (
                          <>
                            <TicketAssigneeIcon className="size-[18px] text-foreground-icon-tertiary" />
                            <Text className="text-body-medium text-text-tertiary">
                              {m.assignee}
                            </Text>
                          </>
                        )}
                      </View>
                    }
                    options={[
                      {
                        id: 'unassigned',
                        label: m.unassigned,
                        icon: (
                          <TicketAssigneeIcon className="size-[18px] text-foreground-icon-secondary" />
                        ),
                      },
                      ...Object.values(members).map((p) => ({
                        id: p.id,
                        label: p.name,
                        icon: <Avatar size="xs" source={p.avatar} initials={p.initials} />,
                      })),
                    ]}
                  />
                  <PropertySelect
                    create
                    label={m.project}
                    value={project ?? ''}
                    onChange={setProject}
                    renderValue={
                      <View className="flex items-center gap-1.5">
                        <RiFolder6Line className="size-[18px] text-text-primary opacity-30" />
                        <Text
                          className={
                            project
                              ? 'text-body-medium text-text-secondary'
                              : 'text-body-medium text-text-tertiary'
                          }
                        >
                          {project ?? m.project}
                        </Text>
                      </View>
                    }
                    options={projects.map((p) => ({
                      id: p,
                      label: p,
                      icon: (
                        <RiFolder6Line className="size-[18px] text-foreground-icon-secondary" />
                      ),
                    }))}
                  />
                </View>
                <View className="flex flex-wrap items-center justify-between gap-3">
                  <View className="flex items-center gap-2">
                    <Switch
                      size="sm"
                      checked={keepCreating}
                      onCheckedChange={setKeepCreating}
                      accessibilityLabel={m.keepCreating}
                    />
                    <Text className="text-body-2-medium text-text-tertiary">{m.keepCreating}</Text>
                  </View>
                  <View className="ms-auto flex gap-2.5">
                    <Button appearance="outline" tone="neutral" onPress={() => control.close()}>
                      {m.cancel}
                    </Button>
                    <Button onPress={submit} testID="project-board-create-submit">
                      {m.createTicket}
                    </Button>
                  </View>
                </View>
              </View>
            </View>
          </TicketFormBody>
        </TicketGenieSurface>
      </View>
    </Dialog>
  );
}
