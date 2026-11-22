import { RiCloseLine as DismissActionIcon } from '../icons/remix/RiCloseLine';
import { ScrollArea } from '../layout/ScrollArea';
import { type ComponentRef, useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  StyleSheet,
  type TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Avatar } from '../avatar';
import { Chip } from '../chip';
import { cssLength, WEB_DISPLAY_GRID } from '../styles/web-view-style';
import { useDialogControl } from '../dialog/context';
import { useIsRtl } from '../hooks/use-is-rtl';
import { RiAddFill } from '../icons/remix/RiAddFill';
import { RiArrowRightSLine } from '../icons/remix/RiArrowRightSLine';
import { RiFolder6Line } from '../icons/remix/RiFolder6Line';
import { useMessages } from '../locale/messages';
import { Switch } from '../switch';
import { Textarea } from '../textarea';
import { useWindowBreakpoint } from '../hooks/use-width-class';
import { useColorTokens } from '../theme/color-tokens';
import { IS_WEB } from '../styles/platform';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DIALOG_CHIP, useChipFills, useChipLabels } from './chips';
import { createTokenStyles } from '../theme/color-tokens';
import { DEFAULT_PROJECT, PRIORITIES } from './constants';
import { useProjectBoardPlatform } from './context';
import { PROJECT_BOARD_MESSAGES } from './messages';
import { useProjectBoardWebCss } from './web-css';
import { PropertySelect } from './ProjectBoardControls';
import { TicketAssigneeIcon, TicketStatusIcon, TicketUrgencyIcon } from './ProjectBoardIcons';
import { ELLIPSIS, NOWRAP, TYPE, useBoardText, useIconFill } from './styles';
import type { NewProjectTicket, ProjectColumn, ProjectMember, TicketPriority } from './types';

const styles = StyleSheet.create({
  frame: { width: 560, maxWidth: '100%' },
  form: { flexDirection: 'column', gap: 48 },
  head: { flexDirection: 'column', gap: 10 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  truncate: { overflow: 'hidden' },
  arrow: { width: 15, height: 15, flexShrink: 0 },
  flip: { transform: [{ rotate: '180deg' }] },
  fields: { flexDirection: 'column', gap: 6 },
  footer: { flexDirection: 'column', gap: 12 },
  properties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 16,
    rowGap: 12,
  },
  value: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  add: { width: 20, height: 20 },
  glyph: { width: 18, height: 18 },
  folder: { width: 18, height: 18, opacity: 0.3 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  keep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttons: { marginInlineStart: 'auto', flexDirection: 'row', gap: 10 },
  chip: { paddingBlock: 3 },
});
/** The fields' `relative grid` box (`grid` is the web's). */
const FIELD = { position: 'relative', ...(IS_WEB ? { display: WEB_DISPLAY_GRID } : null) } as const;

const useStyles = createTokenStyles((t) => ({
  // The type and colour each field's class set on its box, as the class set them.
  titleField: { ...FIELD, ...TYPE.headline, color: t.foreground },
  descriptionField: { ...FIELD, maxHeight: 200, ...TYPE.body, color: t.mutedForeground },
  // `max-sm:text-[16px]`.
  descriptionFieldPhone: {
    ...FIELD,
    maxHeight: 200,
    ...TYPE.body,
    fontSize: 16,
    lineHeight: IS_WEB ? TYPE.body.lineHeight : 22.86,
    color: t.mutedForeground,
  },
  // The crumbs' type and colour sit on the row as the class set them.
  crumbs: {
    flexDirection: 'row',
    minWidth: 0,
    alignItems: 'center',
    gap: 2,
    ...TYPE.caption,
    color: t.mutedForeground,
  },
}));
/** `rtl:rotate-180`: the web's `rotate`, a transform on native. */
const FLIP = IS_WEB ? ({ rotate: '180deg' } as object) : styles.flip;
/** `outline-none` on the web. */
const NO_OUTLINE = IS_WEB ? ({ outlineStyle: 'none' } as object) : undefined;

/**
 * Low is indigo here (`bg-indigo-200 text-indigo-800`, `dark:bg-indigo-950/60
 * dark:text-indigo-300` on the pill; its label kept `text-indigo-800`): the
 * palette's values, the web's `oklch()` through the sheet's variables (a
 * react-native-web style takes no `oklch()`), and as native resolved them.
 */
const LOW = IS_WEB
  ? {
      light: {
        backgroundColor: 'var(--bloom-board-indigo-200)',
        color: 'var(--bloom-board-indigo-800)',
      },
      dark: {
        backgroundColor: 'var(--bloom-board-indigo-950-60)',
        color: 'var(--bloom-board-indigo-300)',
      },
      label: { color: 'var(--bloom-board-indigo-800)' },
    }
  : {
      light: { backgroundColor: '#c6d2ff', color: '#372aac' },
      dark: { backgroundColor: '#1e1a4d99', color: '#a3b3ff' },
      label: { color: '#372aac' },
    };

function TicketFormBody({ children }: { children: ReactNode }) {
  const { height } = useWindowDimensions();
  const tokens = useColorTokens();
  if (Platform.OS === 'web')
    return (
      <ScrollArea
        style={{
          maxHeight: cssLength('calc(100dvh - 56px)'),
          borderRadius: 24,
          backgroundColor: tokens.card,
        }}
        contentContainerStyle={{ padding: 16 }}
      >
        {children}
      </ScrollArea>
    );
  return (
    <ScrollArea
      testID="project-board-create-scroll"
      style={{
        borderRadius: 24,
        backgroundColor: tokens.card,
        maxHeight: height - 56,
        flexGrow: 0,
        flexShrink: 1,
      }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {children}
    </ScrollArea>
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
  const tokens = useColorTokens();
  const phone = useWindowBreakpoint() === 'base';
  const { isDark } = useTheme();
  const text = useBoardText();
  const fills = useChipFills();
  const labels = useChipLabels();
  const rtl = useIsRtl();
  const own = useStyles();
  const iconFill = useIconFill();
  useProjectBoardWebCss();
  const { Button, Dialog, TicketGenieSurface } = useProjectBoardPlatform();
  const control = useDialogControl();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState<string | null>(initialColumnId ?? null);
  const [priority, setPriority] = useState<TicketPriority | null>(null);
  const [assignee, setAssignee] = useState<string | null>(null);
  const [project, setProject] = useState<string | null>(null);
  const [keepCreating, setKeepCreating] = useState(false);
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);
  const member = assignee ? members[assignee] : undefined;
  const selectedColumn = columns.find((column) => column.id === columnId);
  const priorityChip = (value: TicketPriority) => (
    <Chip
      bare
      style={[
        DIALOG_CHIP,
        styles.chip,
        value === 'Low' ? (isDark ? LOW.dark : LOW.light) : fills[value],
      ]}
      textStyle={[value === 'Low' ? LOW.label : labels[value], NOWRAP]}
    >
      {m.priorityLabels[value]}
    </Chip>
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
      containerStyle={{
        // The full-window container (`inset-0 px-4`), as its class set it.
        inset: 0,
        paddingInline: 16,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
        paddingBottom: 40,
      }}
      panelStyle={{
        position: 'relative',
        left: undefined,
        right: undefined,
        width: '100%',
        maxWidth: 560,
        backgroundColor: 'transparent',
      }}
    >
      <View style={[styles.frame, NO_OUTLINE, { width: '100%' }]}>
        <TicketGenieSurface>
          <TicketFormBody>
            <View style={styles.form}>
              <View style={styles.head}>
                <View style={styles.topRow}>
                  <View style={own.crumbs}>
                    <Text style={[styles.truncate, text.captionMuted, ELLIPSIS]}>{boardTitle}</Text>
                    <RiArrowRightSLine
                      fill={iconFill}
                      style={[styles.arrow, text.icon, rtl && FLIP]}
                    />
                    <Text style={text.captionMuted}>{code}</Text>
                    <RiArrowRightSLine
                      fill={iconFill}
                      style={[styles.arrow, text.icon, rtl && FLIP]}
                    />
                    <Text style={[text.captionMuted, NOWRAP]}>{m.newTicket}</Text>
                  </View>
                  <Button
                    appearance="outline"
                    tone="neutral"
                    iconOnly
                    icon={DismissActionIcon}
                    size={24}
                    accessibilityLabel={m.closeCreate}
                    onPress={() => control.close()}
                  />
                </View>
                <View style={styles.fields}>
                  <Textarea
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
                    style={own.titleField}
                    bare
                    inputStyle={{
                      height: '100%',
                      overflow: 'hidden',
                      paddingLeft: 0,
                      paddingRight: 0,
                      fontSize: 16,
                      lineHeight: 22,
                      fontWeight: '500',
                      color: tokens.foreground,
                      minHeight: 22,
                    }}
                  />
                  <Textarea
                    style={phone ? own.descriptionFieldPhone : own.descriptionField}
                    accessibilityLabel={m.description}
                    value={description}
                    onValueChange={setDescription}
                    rows={1}
                    maxLength={5000}
                    autoResize
                    maxRows={10}
                    placeholder={m.descriptionArea}
                    bare
                    inputStyle={{
                      height: '100%',
                      paddingLeft: 0,
                      paddingRight: 0,
                      fontSize: phone ? 16 : 14,
                      lineHeight: phone ? 22.86 : 20,
                      fontWeight: '500',
                      color: tokens.mutedForeground,
                    }}
                  />
                </View>
              </View>
              <View style={styles.footer}>
                <View style={styles.properties}>
                  <PropertySelect
                    create
                    label={m.status}
                    value={columnId ?? ''}
                    onChange={setColumnId}
                    renderValue={
                      <View style={styles.value}>
                        {selectedColumn ? (
                          <>
                            <TicketStatusIcon status={selectedColumn.id} />
                            <Text style={text.bodyMuted}>{selectedColumn.title}</Text>
                          </>
                        ) : (
                          <>
                            <RiAddFill fill={iconFill} style={[styles.add, text.icon]} />
                            <Text style={text.bodyMuted}>{m.status}</Text>
                          </>
                        )}
                      </View>
                    }
                    options={columns.map((c) => ({
                      id: c.id,
                      label: c.title,
                      icon: <TicketStatusIcon status={c.id} style={text.icon} />,
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
                        <View style={styles.value}>
                          <TicketUrgencyIcon style={[styles.glyph, text.icon]} />
                          <Text style={text.bodyMuted}>{m.urgency}</Text>
                        </View>
                      )
                    }
                    options={PRIORITIES.map((v) => ({
                      id: v,
                      label: m.priorityLabels[v],
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
                      <View style={styles.value}>
                        {member ? (
                          <>
                            <View style={styles.glyph}>
                              <Avatar source={member.avatar} initials={member.initials} size={18} />
                            </View>
                            <Text style={text.bodyMuted}>
                              {member.name.split(' ')[0]} {member.name.split(' ')[1]?.[0]}.
                            </Text>
                          </>
                        ) : (
                          <>
                            <TicketAssigneeIcon style={[styles.glyph, text.icon]} />
                            <Text style={text.bodyMuted}>{m.assignee}</Text>
                          </>
                        )}
                      </View>
                    }
                    options={[
                      {
                        id: 'unassigned',
                        label: m.unassigned,
                        icon: <TicketAssigneeIcon style={[styles.glyph, text.icon]} />,
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
                      <View style={styles.value}>
                        <RiFolder6Line fill={iconFill} style={[styles.folder, text.iconPrimary]} />
                        <Text style={text.bodyMuted}>{project ?? m.project}</Text>
                      </View>
                    }
                    options={projects.map((p) => ({
                      id: p,
                      label: p,
                      icon: <RiFolder6Line fill={iconFill} style={[styles.glyph, text.icon]} />,
                    }))}
                  />
                </View>
                <View style={styles.actions}>
                  <View style={styles.keep}>
                    <Switch
                      size="sm"
                      checked={keepCreating}
                      onCheckedChange={setKeepCreating}
                      accessibilityLabel={m.keepCreating}
                    />
                    <Text style={text.captionMuted}>{m.keepCreating}</Text>
                  </View>
                  <View style={styles.buttons}>
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
