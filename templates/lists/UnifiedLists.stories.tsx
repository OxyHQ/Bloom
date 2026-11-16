import { PageHeader } from '../../src/page-header';
import { AvatarGroup } from '../../src/avatar-group';
import { ListItem, ListSelectionBar } from '../../src/list';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '../../src/avatar';
import type { AvatarCharacter } from '../../src/agent-avatar';
import { Badge } from '../../src/badge';
import { Button } from '../../src/button';
import { ChatSearchField } from '../../src/chat-list/ChatSearchField';
import { Collapsible } from '../../src/collapsible';
import { Chip } from '../../src/chip';
import { RiFilePdf2Line } from '../../src/icons/remix/RiFilePdf2Line';
import { RiFileImageLine } from '../../src/icons/remix/RiFileImageLine';
import { RiFileExcel2Line } from '../../src/icons/remix/RiFileExcel2Line';
import { Checkbox } from '../../src/checkbox';
import { ResponsiveGrid } from '../../src/grid';
import { BloomImage } from '../../src/image';
import { RadioGroup } from '../../src/radio';
import { Switch } from '../../src/switch';
import { RiFolderLine } from '../../src/icons/remix/RiFolderLine';
import { EmptyState } from '../../src/empty-state';
import { RiArchiveLine } from '../../src/icons/remix/RiArchiveLine';
import { RiArrowDownSLine } from '../../src/icons/remix/RiArrowDownSLine';
import { RiArrowRightSLine } from '../../src/icons/remix/RiArrowRightSLine';
import { RiCheckDoubleLine } from '../../src/icons/remix/RiCheckDoubleLine';
import { RiPushpinLine } from '../../src/icons/remix/RiPushpinLine';
import { RiSearchLine } from '../../src/icons/remix/RiSearchLine';
import { AppShell } from '../../src/app-shell';
import { Screen, ScreenScrollView } from '../../src/screen';
import * as Skeleton from '../../src/skeleton';
import { adoptStyleSheet } from '../../src/styles/adopt-style-sheet';
import { useSurfaceFill } from '../../src/styles/surface-levels';
import { webDataSet } from '../../src/styles/web-data';
import { Surface } from '../../src/surface';
import { useTheme } from '../../src/theme/use-theme';
import { Text } from '../../src/typography';
const ann = new URL('../shared/assets/avatars/ann-press.webp', import.meta.url).href;
const john = new URL('../shared/assets/avatars/john-clarkson.webp', import.meta.url).href;
const maria = new URL('../shared/assets/avatars/maria-lubin.webp', import.meta.url).href;
const michael = new URL('../shared/assets/avatars/michael-ekstrom.webp', import.meta.url).href;

/** Gemies, Allo and Inbosh fixtures composed with the production ListItem. */
type IdentityMember = { name: string; avatar?: string; kind?: string; character?: AvatarCharacter };

type DemoAttachment = { name: string; kind: 'pdf' | 'image' | 'sheet' };
const ATTACHMENT_ICONS = { pdf: RiFilePdf2Line, image: RiFileImageLine, sheet: RiFileExcel2Line };

type DemoRow = {
  id: string;
  title: string;
  preview: string;
  people: IdentityMember[];
  time: string;
  unread?: number;
  pinned?: boolean;
  typing?: boolean;
  delivered?: boolean;
  draft?: boolean;
  attachments?: DemoAttachment[];
  tag?: string;
};
type DemoApp = { name: string; title: string; subtitle: string; rows: DemoRow[] };
type DemoOptions = { state: 'ready' | 'loading' | 'empty'; app?: string };

const people: [IdentityMember, IdentityMember, IdentityMember, IdentityMember] = [
  { name: 'Ana Ferrer', avatar: ann },
  { name: 'Marcos Soler', avatar: john },
  { name: 'María Costa', avatar: maria },
  { name: 'Dani Vidal', avatar: michael },
];
const agents: [IdentityMember, IdentityMember, IdentityMember, IdentityMember] = [
  { name: 'Lumi', kind: 'bot', character: { preset: 'blue_beret', color: 'teal' } },
  { name: 'Atlas', kind: 'bot', character: { preset: 'purple_heart', color: 'violet' } },
  { name: 'Sol', kind: 'bot', character: { preset: 'alfred' } },
  { name: 'Milo', kind: 'bot', character: { preset: 'blue_spectacles' } },
];
const APPS: DemoApp[] = [
  {
    name: 'Gemies',
    title: 'Your Gemies',
    subtitle: 'Agentes y equipos',
    rows: [
      {
        id: 'lumi',
        title: 'Lumi',
        preview: 'Ya tengo las ideas para el lanzamiento.',
        people: [agents[0]],
        time: '12:41',
        unread: 2,
        pinned: true,
      },
      {
        id: 'launch',
        title: 'Equipo de lanzamiento',
        preview: 'Atlas: el plan está listo para revisar.',
        people: agents.slice(0, 3),
        time: '12:32',
        unread: 4,
        pinned: true,
      },
      {
        id: 'atlas',
        title: 'Atlas',
        preview: 'Preparando el resumen…',
        people: [agents[1]],
        time: 'Ahora',
        typing: true,
      },
      {
        id: 'duo',
        title: 'Diseño y contenido',
        preview: 'Lumi: probamos con esta dirección.',
        people: agents.slice(0, 2),
        time: '11:20',
      },
      {
        id: 'sol',
        title: 'Sol',
        preview: 'Tres cosas que puedes simplificar hoy.',
        people: [agents[2]],
        time: '10:48',
        unread: 1,
      },
      {
        id: 'team',
        title: 'Todo el equipo',
        preview: 'Sol: nos vemos en la revisión.',
        people: agents,
        time: 'Ayer',
      },
      {
        id: 'notes',
        title: 'Notas de producto',
        preview: 'Cambios de la próxima versión.',
        people: [agents[3]],
        time: 'Ayer',
        draft: true,
      },
    ],
  },
  {
    name: 'Allo',
    title: 'Conversaciones',
    subtitle: 'Personas y grupos',
    rows: [
      {
        id: 'ana',
        title: 'Ana Ferrer',
        preview: '¿Tomamos un café después?',
        people: [people[0]],
        time: '12:41',
        unread: 2,
        pinned: true,
      },
      {
        id: 'weekend',
        title: 'Planes del finde',
        preview: 'María: ¡yo me apunto!',
        people: people.slice(0, 3),
        time: '12:32',
        unread: 4,
        pinned: true,
      },
      {
        id: 'marcos',
        title: 'Marcos Soler',
        preview: 'Escribiendo…',
        people: [people[1]],
        time: 'Ahora',
        typing: true,
      },
      {
        id: 'home',
        title: 'Casa',
        preview: 'Tú: llego en diez minutos.',
        people: people.slice(0, 2),
        time: '11:20',
        delivered: true,
      },
      {
        id: 'maria',
        title: 'María Costa',
        preview: 'Fotos de la escapada',
        people: [people[2]],
        time: '10:48',
        attachments: [{ name: 'Escapada.jpg', kind: 'image' }],
        unread: 1,
      },
      {
        id: 'friends',
        title: 'Los de siempre',
        preview: 'Dani: la próxima la organizo yo.',
        people,
        time: 'Ayer',
      },
      {
        id: 'dani',
        title: 'Dani Vidal',
        preview: 'Sobre lo que hablamos ayer…',
        people: [people[3]],
        time: 'Ayer',
        draft: true,
      },
    ],
  },
  {
    name: 'Inbosh',
    title: 'Bandeja de entrada',
    subtitle: 'Correo y conversaciones',
    rows: [
      {
        id: 'proposal',
        title: 'Ana Ferrer',
        preview: 'Propuesta de diseño · Te envío la última versión.',
        people: [people[0]],
        time: '12:41',
        unread: 2,
        pinned: true,
        attachments: [
          { name: 'Propuesta.pdf', kind: 'pdf' },
          { name: 'Portada.png', kind: 'image' },
          { name: 'Presupuesto.xlsx', kind: 'sheet' },
          { name: 'Referencias.pdf', kind: 'pdf' },
        ],
      },
      {
        id: 'review',
        title: 'Equipo de producto',
        preview: 'Revisión del viernes · Ya está todo preparado.',
        people: people.slice(0, 3),
        time: '12:32',
        unread: 4,
        pinned: true,
      },
      {
        id: 'contract',
        title: 'Marcos Soler',
        preview: 'Contrato actualizado · Solo falta tu revisión.',
        people: [people[1]],
        time: '11:50',
        attachments: [{ name: 'Contrato.pdf', kind: 'pdf' }],
        tag: 'Trabajo',
      },
      {
        id: 'feedback',
        title: 'Ana y María',
        preview: 'Re: Nueva identidad · Nos gusta esta dirección.',
        people: [people[0], people[2]],
        time: '11:20',
      },
      {
        id: 'booking',
        title: 'María Costa',
        preview: 'Reserva confirmada · Nos vemos el sábado.',
        people: [people[2]],
        time: '10:48',
        unread: 1,
      },
      {
        id: 'release',
        title: 'Lanzamiento de noviembre',
        preview: 'Dani: adjunto el resumen de la reunión.',
        people,
        time: 'Ayer',
        attachments: [
          { name: 'Resumen.pdf', kind: 'pdf' },
          { name: 'Calendario.xlsx', kind: 'sheet' },
        ],
      },
      {
        id: 'reply',
        title: 'Dani Vidal',
        preview: 'Re: Presupuesto · Gracias por enviármelo…',
        people: [people[3]],
        time: 'Ayer',
        draft: true,
      },
    ],
  },
];

const DEMO_CSS = `
[data-unified-media] { width:96px !important; height:60px !important; }
@container (max-width:560px) { [data-unified-media] { width:72px !important; height:48px !important; } }
@container (max-width:380px) { [data-unified-media] { width:44px !important; height:44px !important; } }
`;

function Identity({ members, size }: { members: IdentityMember[]; size: number }) {
  const surface = useSurfaceFill();
  return (
    <AvatarGroup
      layout="conversation"
      size={size}
      ringColor={surface}
      ringWidth={1}
      showInitials
      items={members.map((member) => ({
        name: member.name,
        uri: member.avatar,
        kind: member.kind,
        character: member.character,
      }))}
    />
  );
}

function UnifiedRow({
  row,
  mail = false,
  active,
  selecting,
  checked,
  onCheck,
  onOpen,
  onAction,
  onAttachmentPress,
}: {
  row: DemoRow;
  mail?: boolean;
  active: boolean;
  selecting: boolean;
  checked: boolean;
  onCheck: (checked: boolean) => void;
  onOpen: () => void;
  onAction: (action: string) => void;
  onAttachmentPress: (attachment: DemoAttachment) => void;
}) {
  const surface = useSurfaceFill();
  const unread = (row.unread ?? 0) > 0;
  const name = [
    row.title,
    row.draft ? 'Borrador' : '',
    row.preview,
    row.time,
    unread ? row.unread + ' sin leer' : '',
    row.pinned ? 'Fijado' : '',
    row.attachments?.length ? row.attachments.length + ' adjuntos' : '',
    row.delivered ? 'Leído' : '',
    row.tag,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <ListItem
      label={name}
      testID={`unified-row-${row.id}`}
      active={active}
      onPress={onOpen}
      selecting={selecting}
      checked={checked}
      onCheckedChange={(next) => (selecting ? onCheck(next) : next && onAction('select'))}
      selectionLabel={`Seleccionar ${row.title}`}
      leading={<Identity members={row.people} size={36} />}
      conversation={
        !mail
          ? {
              name: row.title,
              preview: {
                text: row.preview,
                draft: row.draft,
                attachment: row.attachments?.length ? { kind: 'file', label: '' } : undefined,
              },
              typingLabel: row.typing ? row.preview : undefined,
              time: row.time,
              unreadCount: row.unread,
              pinned: row.pinned,
              outgoingStatus: row.delivered ? 'read' : undefined,
              marker: row.tag ? (
                <Badge content={row.tag} size="sm" appearance="subtle" />
              ) : undefined,
            }
          : undefined
      }
      mail={
        mail
          ? {
              sender: { name: row.title },
              subject: row.preview,
              time: row.time,
              unread,
              draft: row.draft,
              hasAttachment: !!row.attachments?.length,
              labels: row.tag ? [{ id: row.tag, name: row.tag }] : undefined,
            }
          : undefined
      }
      attachments={row.attachments?.map((attachment, index) => (
        <Chip
          key={attachment.name}
          leadingIcon={ATTACHMENT_ICONS[attachment.kind]}
          appearance="outline"
          tone="neutral"
          surface={surface}
          onPress={() => (selecting ? onCheck(!checked) : onAttachmentPress(attachment))}
          accessibilityLabel={
            selecting ? `Seleccionar ${row.title}` : `Ver adjunto ${attachment.name}`
          }
          style={{ maxWidth: 220 }}
          testID={`unified-attachment-${row.id}-${index}`}
        >
          {attachment.name}
        </Chip>
      ))}
      actions={[
        {
          key: 'read',
          label: unread ? 'Marcar como leído' : 'Marcar como no leído',
          icon: RiCheckDoubleLine,
        },
        { key: 'pin', label: row.pinned ? 'Desfijar' : 'Fijar', icon: RiPushpinLine },
        { key: 'select', label: 'Seleccionar', icon: RiCheckDoubleLine },
        { key: 'archive', label: 'Archivar', icon: RiArchiveLine },
      ]}
      swipeActions={{
        left: [
          {
            key: 'read',
            label: unread ? 'Marcar leído' : 'Marcar no leído',
            icon: RiCheckDoubleLine,
            tone: 'accent',
          },
        ],
        right: [
          { key: 'pin', label: row.pinned ? 'Desfijar' : 'Fijar', icon: RiPushpinLine },
          { key: 'archive', label: 'Archivar', icon: RiArchiveLine, tone: 'accent' },
        ],
      }}
      fullSwipeAction={{ left: 'read', right: 'archive' }}
      onAction={onAction}
    />
  );
}

function ListPanel({ app, state }: { app: DemoApp; state: DemoOptions['state'] }) {
  const theme = useTheme();
  const [rows, setRows] = useState(app.rows);
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [active, setActive] = useState<string>();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const visible =
    state === 'empty'
      ? []
      : rows.filter(
          (row) =>
            (!unreadOnly || !!row.unread) &&
            `${row.title} ${row.preview}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        );
  const current = rows.find((row) => row.id === active);
  const check = (id: string, next: boolean) =>
    setChecked((ids) => (next ? [...new Set([...ids, id])] : ids.filter((value) => value !== id)));
  const action = (id: string, type: string) => {
    if (type === 'select') {
      setSelecting(true);
      setChecked([id]);
    } else if (type === 'archive') {
      setNotice(`Archivado: ${rows.find((row) => row.id === id)?.title}`);
      setRows((items) => items.filter((row) => row.id !== id));
      setChecked((ids) => ids.filter((value) => value !== id));
      if (active === id) setActive(undefined);
    } else
      setRows((items) =>
        items.map((row) =>
          row.id !== id
            ? row
            : type === 'pin'
              ? { ...row, pinned: !row.pinned }
              : { ...row, unread: row.unread ? 0 : 1 },
        ),
      );
  };
  const reset = () => {
    setRows(app.rows);
    setQuery('');
    setUnreadOnly(false);
    setChecked([]);
    setSelecting(false);
    setActive(undefined);
    setCollapsed([]);
    setNotice('');
  };
  return (
    <Screen
      testID={`unified-panel-${app.name}`}
      header={
        <PageHeader
          title={app.title}
          subtitle={app.subtitle}
          onBack={null}
          safeArea={false}
          actions={
            <Button
              tone="neutral"
              onPress={() => {
                setSelecting(!selecting);
                setChecked([]);
              }}
              pressed={selecting}
            >
              {selecting ? 'Terminar' : 'Seleccionar'}
            </Button>
          }
          accessory={
            <View style={{ gap: 8 }}>
              <ChatSearchField
                value={query}
                onChangeText={setQuery}
                onClear={() => setQuery('')}
                placeholder="Buscar…"
                accessibilityLabel={`Buscar en ${app.name}`}
                clearLabel="Borrar búsqueda"
              />
              <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 4 }}>
                <Button
                  tone="neutral"
                  size="sm"
                  appearance={unreadOnly ? 'plain' : 'subtle'}
                  pressed={!unreadOnly}
                  onPress={() => setUnreadOnly(false)}
                >
                  {'Todos'}
                </Button>
                <Button
                  tone="neutral"
                  size="sm"
                  appearance={unreadOnly ? 'subtle' : 'plain'}
                  pressed={unreadOnly}
                  onPress={() => setUnreadOnly(true)}
                >
                  {'No leídos'}
                </Button>
                <View style={{ flex: 1 }} />
                <Button tone="neutral" size="sm" appearance="plain" onPress={reset}>
                  {'Reiniciar'}
                </Button>
              </View>
              <ListSelectionBar
                selecting={selecting}
                count={checked.length}
                total={visible.length}
                onSelectAll={(next) => setChecked(next ? visible.map((row) => row.id) : [])}
                onClear={() => {
                  setSelecting(false);
                  setChecked([]);
                }}
                strings={{
                  selectAll: `Seleccionar todos en ${app.name}`,
                  clearSelection: 'Terminar selección',
                  selectedCount: (count) => `${count} seleccionados`,
                }}
                actions={
                  checked.length ? [{ key: 'archive', label: 'Archivar', icon: RiArchiveLine }] : []
                }
                onAction={() => {
                  setRows((items) => items.filter((row) => !checked.includes(row.id)));
                  if (active && checked.includes(active)) setActive(undefined);
                  setNotice(`${checked.length} archivados`);
                  setChecked([]);
                }}
              />
            </View>
          }
        />
      }
      bottomBar={
        <View
          style={{
            borderTopWidth: 1,
            borderColor: theme.colors.border,
            paddingHorizontal: 10,
            paddingTop: 12,
            paddingBottom: 4,
            gap: 4,
            minHeight: 62,
          }}
        >
          <Text variant="caption-2-medium" style={{ color: theme.colors.textSecondary }}>
            {current ? 'VISTA PREVIA' : 'PRUEBA LA LISTA'}
          </Text>
          <Text variant="body-2-regular" numberOfLines={2} testID={`unified-feedback-${app.name}`}>
            {notice ||
              (current
                ? `${current.title} · ${current.preview}`
                : 'Abre una fila o pasa el cursor para ver sus acciones.')}
          </Text>
        </View>
      }
    >
      <ScreenScrollView contentContainerStyle={{ gap: 16, padding: 12 }}>
        {state === 'loading' ? (
          <Skeleton.Region label={`Cargando ${app.title}`}>
            {app.rows.map((row) => (
              <View
                key={row.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  height: 58,
                }}
              >
                <Skeleton.Circle size={36} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton.Box height={12} width="58%" />
                  <Skeleton.Box height={10} width="88%" />
                </View>
              </View>
            ))}
          </Skeleton.Region>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={RiSearchLine}
            title="Nada por aquí"
            description={
              query
                ? `No hay resultados para “${query}”.`
                : 'No hay elementos que mostrar con este filtro.'
            }
          />
        ) : (
          ['Fijados', 'Recientes'].map((section) => {
            const items = visible.filter((row) => Boolean(row.pinned) === (section === 'Fijados'));
            if (!items.length) return null;
            const closed = collapsed.includes(section);
            return (
              <View key={section} style={{ gap: 6 }}>
                <Button
                  tone="neutral"
                  appearance="plain"
                  size="sm"
                  icon={closed ? RiArrowRightSLine : RiArrowDownSLine}
                  onPress={() =>
                    setCollapsed((values) =>
                      closed ? values.filter((value) => value !== section) : [...values, section],
                    )
                  }
                  accessibilityLabel={`${closed ? 'Expandir' : 'Contraer'} ${section} en ${app.name}`}
                  style={{ alignSelf: 'flex-start' }}
                >
                  {section}
                </Button>
                {!closed ? (
                  <View
                    role="list"
                    accessibilityLabel={`${app.name}: ${section}`}
                    style={{ gap: 2 }}
                  >
                    {items.map((row) => (
                      <View role="listitem" key={row.id}>
                        <UnifiedRow
                          row={row}
                          mail={app.name === 'Inbosh'}
                          active={active === row.id}
                          selecting={selecting}
                          checked={checked.includes(row.id)}
                          onCheck={(next) => check(row.id, next)}
                          onOpen={() => {
                            setActive(row.id);
                            setNotice('');
                            setRows((values) =>
                              values.map((value) =>
                                value.id === row.id ? { ...value, unread: 0 } : value,
                              ),
                            );
                          }}
                          onAction={(type) => action(row.id, type)}
                          onAttachmentPress={(attachment) =>
                            setNotice(`Adjunto seleccionado: ${attachment.name}`)
                          }
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScreenScrollView>
    </Screen>
  );
}

const MEDIA_ITEMS = [
  {
    id: 'perfume',
    title: 'Eau de Bloom',
    meta: '48 €',
    image: new URL('../ai-chat/assets/gallery/perfume-still-life.webp', import.meta.url).href,
    description:
      'Una fragancia suave con notas de bergamota, madera de cedro y flores blancas. Frasco de vidrio de 50 ml, diseñado para acompañarte cada día.',
  },
  {
    id: 'bookshop',
    title: 'Librerías de Seúl',
    meta: '24 fotos',
    image: new URL('../ai-chat/assets/gallery/hanok-bookshop.webp', import.meta.url).href,
    description:
      'Patios tranquilos, estanterías de madera y pequeñas librerías de barrio. Una colección de rincones para detenerse, leer y encontrar nuevas historias.',
  },
  {
    id: 'linen',
    title: 'Luz y lino',
    meta: '8 nov',
    image: new URL('../ai-chat/assets/gallery/linen-campaign.webp', import.meta.url).href,
    description:
      'Texturas naturales y luz de la mañana: referencias para la próxima campaña, con composiciones, materiales y detalles que queremos explorar.',
  },
];

function AnatomyExamples() {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [columns, setColumns] = useState(false);
  const [picked, setPicked] = useState<string[]>(['ana']);
  const [notifications, setNotifications] = useState(true);
  const [account, setAccount] = useState('personal');
  const [opened, setOpened] = useState('');
  const [controlSide, setControlSide] = useState<'leading' | 'trailing'>('trailing');
  const metadata = (value: string) => (
    <Text variant="caption-1-medium" style={{ color: theme.colors.textSecondary, flexShrink: 0 }}>
      {value}
    </Text>
  );
  const control = (node: ReactNode) =>
    controlSide === 'leading' ? { selection: node } : { trailing: node };
  return (
    <View style={{ gap: 20 }} testID="unified-anatomy">
      <View style={{ gap: 8 }}>
        <Text variant="title-2-semibold">La misma fila, más posibilidades</Text>
        <Text variant="body-2-regular" style={{ color: theme.colors.textSecondary }}>
          Personas, contenido y ajustes. El espacio disponible decide cuánta información mostrar.
        </Text>
      </View>
      <Surface radius={24} style={{ padding: 12, gap: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: 8,
          }}
        >
          <Text variant="headline-semibold">Contenido</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="body-2-regular">Varias columnas</Text>
            <Switch
              accessibilityLabel="Varias columnas"
              checked={columns}
              onCheckedChange={setColumns}
              testID="unified-columns"
            />{' '}
          </View>
        </View>
        <ResponsiveGrid
          minItemWidth={420}
          maxColumns={columns ? 2 : 1}
          gap={8}
          testID="unified-media-grid"
        >
          {MEDIA_ITEMS.map((item) => (
            <ListItem
              key={item.id}
              testID={`unified-row-${item.id}`}
              label={`${item.title}, ${item.description}, ${item.meta}`}
              active={opened === item.id}
              onPress={() => setOpened(item.id)}
              leading={
                <View
                  {...webDataSet({ unifiedMedia: '' })}
                  pointerEvents="none"
                  aria-hidden
                  style={{ width: 72, height: 48, borderRadius: 8, overflow: 'hidden' }}
                >
                  <BloomImage
                    source={{ uri: item.image }}
                    contentFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              }
              title={item.title}
              supporting={item.description}
              supportingLines="adaptive"
              trailing={
                <View pointerEvents="none" aria-hidden>
                  {metadata(item.meta)}
                </View>
              }
            />
          ))}
        </ResponsiveGrid>
        <ListItem
          testID="unified-row-documents"
          label="Documentos compartidos, 128 archivos"
          onPress={() => setOpened('documents')}
          active={opened === 'documents'}
          leading={
            <View pointerEvents="none" aria-hidden style={{ width: 36, alignItems: 'center' }}>
              <RiFolderLine width={24} height={24} fill={theme.colors.textSecondary} />
            </View>
          }
          title="Documentos compartidos"
          supporting="Propuestas, acuerdos y notas del equipo."
          supportingLines="adaptive"
          trailing={
            <View
              pointerEvents="none"
              aria-hidden
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              {metadata('128')}
              <RiArrowRightSLine width={20} height={20} fill={theme.colors.textSecondary} />
            </View>
          }
        />
        {opened ? (
          <Text
            variant="caption-1-regular"
            accessibilityLiveRegion="polite"
            style={{ paddingHorizontal: 10 }}
          >
            Vista previa:{' '}
            {MEDIA_ITEMS.find((item) => item.id === opened)?.title ??
              (opened === 'documents' ? 'Documentos compartidos' : opened)}
          </Text>
        ) : null}
      </Surface>
      <Surface radius={24} style={{ padding: 12, gap: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: 8,
          }}
        >
          <Text variant="headline-semibold">Selección y ajustes</Text>
          <Button
            appearance="subtle"
            tone="neutral"
            onPress={() => setControlSide(controlSide === 'leading' ? 'trailing' : 'leading')}
            testID="unified-control-side"
          >
            {controlSide === 'leading' ? 'Controles al final' : 'Controles al inicio'}
          </Button>
        </View>
        {people.slice(0, 2).map((person, i) => {
          const id = i === 0 ? 'ana' : 'marcos';
          return (
            <ListItem
              key={id}
              testID={`unified-row-${`recipient-${id}`}`}
              label={person.name}
              active={picked.includes(id)}
              leading={
                <Avatar
                  source={person.avatar}
                  name={person.name}
                  shape={i === 0 ? 'circle' : 'squircle'}
                  size={36}
                />
              }
              title={person.name}
              supporting="Puede recibir una copia del documento."
              supportingLines="adaptive"
              {...control(
                <Checkbox
                  accessibilityLabel={`Enviar copia a ${person.name}`}
                  checked={picked.includes(id)}
                  onCheckedChange={(next) =>
                    setPicked((ids) => (next ? [...ids, id] : ids.filter((value) => value !== id)))
                  }
                  testID={`unified-recipient-${id}`}
                />,
              )}
            />
          );
        })}
        <ListItem
          testID="unified-row-notifications"
          label="Notificaciones"
          active={notifications}
          title="Notificaciones"
          supporting="Recibir avisos de nuevas conversaciones."
          supportingLines="adaptive"
          {...control(
            <Switch
              accessibilityLabel="Notificaciones"
              checked={notifications}
              onCheckedChange={setNotifications}
              testID="unified-notifications"
            />,
          )}
        />
        <RadioGroup
          label="Cuenta predeterminada"
          value={account}
          onValueChange={setAccount}
          options={[
            { value: 'personal', accessibilityLabel: 'Cuenta personal' },
            { value: 'work', accessibilityLabel: 'Cuenta de trabajo' },
          ]}
          renderOption={(option, ownedControl, state) => (
            <ListItem
              testID={`unified-row-${`account-${option.value}`}`}
              label={option.accessibilityLabel ?? ''}
              active={state.checked}
              title={option.accessibilityLabel ?? ''}
              supporting={
                option.value === 'personal'
                  ? 'Para tus conversaciones del día a día.'
                  : 'Para los proyectos y mensajes del equipo.'
              }
              supportingLines="adaptive"
              {...control(ownedControl)}
            />
          )}
        />
      </Surface>
      <Surface radius={24} style={{ padding: 12, gap: 4 }}>
        <Text variant="headline-semibold" style={{ padding: 8 }}>
          Carpetas
        </Text>
        <ListItem
          testID="unified-row-folder"
          label="Recursos del proyecto"
          active={expanded}
          trigger={
            <Button
              appearance="plain"
              tone="neutral"
              accessibilityLabel="Recursos del proyecto"
              aria-expanded={expanded}
              aria-controls="unified-folder-content"
              onPress={() => setExpanded((value) => !value)}
              testID="unified-folder-toggle"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: 28,
              }}
            />
          }
          leading={
            <View pointerEvents="none" aria-hidden style={{ width: 36, alignItems: 'center' }}>
              <RiFolderLine width={24} height={24} fill={theme.colors.textSecondary} />
            </View>
          }
          title="Recursos del proyecto"
          supporting="2 documentos compartidos"
          supportingLines="adaptive"
          trailing={
            <View
              pointerEvents="none"
              aria-hidden
              style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
            >
              <RiArrowDownSLine width={20} height={20} fill={theme.colors.textSecondary} />
            </View>
          }
        />
        <Collapsible
          open={expanded}
          nativeID="unified-folder-content"
          testID="unified-folder-content"
        >
          <View style={{ paddingLeft: 36 }}>
            {['Guía de marca', 'Notas del lanzamiento'].map((title, i) => (
              <ListItem
                key={title}
                testID={`unified-row-${`folder-child-${i}`}`}
                label={title}
                onPress={() => setOpened(title)}
                active={opened === title}
                title={title}
                supporting={
                  i === 0
                    ? 'Identidad, colores y tipografía.'
                    : 'Ideas y próximos pasos del equipo.'
                }
                supportingLines="adaptive"
                trailing={
                  <View pointerEvents="none" aria-hidden>
                    {metadata(i === 0 ? 'PDF' : '12 nov')}
                  </View>
                }
              />
            ))}
          </View>
        </Collapsible>
      </Surface>
      <Surface radius={24} style={{ padding: 12, gap: 4 }} testID="unified-information">
        <Text variant="headline-semibold" style={{ padding: 8 }}>
          Información
        </Text>
        {[
          ['format', 'Formato', 'Documento PDF', '2,4 MB'],
          ['created', 'Creado', 'Disponible para todo el equipo', '8 nov'],
          ['updated', 'Actualizado', 'Última revisión del documento', 'Hoy'],
        ].map(([id, title, description, detail]) => (
          <ListItem
            key={id}
            testID={`unified-row-${`info-${id}`}`}
            label={title!}
            title={title!}
            supporting={description!}
            supportingLines="adaptive"
            trailing={metadata(detail!)}
          />
        ))}
      </Surface>
    </View>
  );
}

function UnifiedListsDemo({ state, app = 'Gemies' }: DemoOptions) {
  useEffect(() => {
    adoptStyleSheet('bloom-unified-lists-demo', DEMO_CSS);
  }, []);
  const selected = APPS.find((item) => item.name === app) ?? APPS[0]!;
  return (
    <AppShell header={null} scroll="fixed" contentMaxWidth="none">
      <ListPanel key={`${selected.name}-${state}`} app={selected} state={state} />
    </AppShell>
  );
}

const meta = {
  id: 'unified-lists-demo',
  title: 'Templates/Unified Lists',
  component: UnifiedListsDemo,
  parameters: { layout: 'fullscreen' },
  args: { state: 'ready', app: 'Gemies' },
  argTypes: {
    state: { control: 'inline-radio', options: ['ready', 'loading', 'empty'] },
    app: { control: 'inline-radio', options: APPS.map((item) => item.name) },
  },
} satisfies Meta<typeof UnifiedListsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };

/** Item anatomy is a component gallery, separate from the application examples. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <AppShell title="Anatomía de las listas" scroll="page">
      <AnatomyExamples />
    </AppShell>
  ),
};
