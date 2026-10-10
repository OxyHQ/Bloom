/**
 * @jest-environment jsdom
 *
 * The chat families speak the app's locale: rendered under `LocaleProvider`,
 * each family's own strings come from its catalog (`src/<family>/messages.ts`)
 * or `COMMON_MESSAGES`, plurals follow the language's rules, and a caller's
 * `labels` / `*Label` prop still wins over the catalog.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { LocaleProvider } from '../locale';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { MessageStatus, PresenceDot, UnreadBadge } from '../chat-indicators';
import { MessageBubble, TypingBubble, UnreadSeparator } from '../message-bubble';
import {
  ChatEmptyState,
  ChatHeader,
  ChatMemberRow,
  PinnedMessageBar,
  ScrollToBottomButton,
} from '../chat-screen';
import { FileMessage, MediaAlbum, PollMessage, VoiceMessage } from '../message-media';
import {
  ChannelPostCard,
  ContactList,
  ContactRow,
  MemberList,
  MemberRow,
  NewGroupForm,
  StoryProgressBars,
} from '../chat-people';
import { CHAT_PEOPLE_MESSAGES } from '../chat-people/messages';
import {
  ATTACHMENT_MENU_ITEMS,
  ChatComposer,
  ComposerAttachmentStrip,
  EmojiPicker,
  ReactionPicker,
  VoiceRecorder,
} from '../chat-composer';
import { attachmentMenuItems } from '../chat-composer/shared';
import { CHAT_COMPOSER_MESSAGES } from '../chat-composer/messages';
import {
  ArchivedRow,
  ChatFolderTabs,
  ChatList,
  ChatListItem,
  ChatSearchField,
  ChatSearchResults,
  NewChatButton,
  StoriesRow,
} from '../chat-list';
import { messagesIn } from './support/messages-in';
import type { BloomLanguage } from '../locale/languages';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement, locale = 'es'): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <LocaleProvider locale={locale}>{ui}</LocaleProvider>
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('chat-indicators, message-bubble and chat-screen', () => {
  const byLabel = (el: HTMLElement, label: string) => el.querySelector(`[aria-label="${label}"]`);

  describe('chat-indicators speaks the app locale', () => {
    it('names presence and delivery in Spanish', () => {
      const el = mount(
        <>
          <PresenceDot status="online" />
          <MessageStatus status="read" />
        </>,
      );
      expect(byLabel(el, 'En línea')).not.toBeNull();
      expect(byLabel(el, 'Leído')).not.toBeNull();
    });

    it('pluralises the unread count (Russian one / few / many)', () => {
      const el = mount(
        <>
          <UnreadBadge count={1} />
          <UnreadBadge count={3} />
          <UnreadBadge count={5} />
        </>,
        'ru',
      );
      expect(byLabel(el, '1 непрочитанное сообщение')).not.toBeNull();
      expect(byLabel(el, '3 непрочитанных сообщения')).not.toBeNull();
      expect(byLabel(el, '5 непрочитанных сообщений')).not.toBeNull();
    });

    it('lets label / formatLabel win over the catalog', () => {
      const el = mount(
        <>
          <MessageStatus status="sent" label="Parti" />
          <UnreadBadge count={2} formatLabel={(n) => `${n} nuevos`} />
        </>,
      );
      expect(byLabel(el, 'Parti')).not.toBeNull();
      expect(byLabel(el, '2 nuevos')).not.toBeNull();
    });
  });

  describe('message-bubble speaks the app locale', () => {
    it('says a deleted message, the forwarded line and a reaction in Spanish', () => {
      const el = mount(
        <>
          <MessageBubble direction="incoming" text="hola" deleted />
          <MessageBubble
            direction="incoming"
            text="hola"
            forwardedFrom="Ana"
            reactions={[{ emoji: '👍', count: 2, mine: true }]}
          />
        </>,
      );
      expect(el.textContent).toContain('Se eliminó este mensaje');
      expect(el.textContent).toContain('Reenviado de Ana');
      expect(byLabel(el, '👍, 2, seleccionada')).not.toBeNull();
    });

    it('puts the name where the language puts it (Japanese forwarded line)', () => {
      const el = mount(<MessageBubble direction="incoming" text="x" forwardedFrom="Ana" />, 'ja');
      expect(el.textContent).toContain('Anaから転送');
    });

    it('names the typing bubble and the unread rule in Spanish', () => {
      const el = mount(
        <>
          <TypingBubble />
          <UnreadSeparator />
        </>,
      );
      expect(byLabel(el, 'Escribiendo…')).not.toBeNull();
      expect(el.textContent).toContain('Mensajes no leídos');
    });

    it('lets labels win: a forwardedFrom prefix and a deleted string', () => {
      const el = mount(
        <>
          <MessageBubble
            direction="incoming"
            text="x"
            forwardedFrom="Ana"
            labels={{ forwardedFrom: 'Desde' }}
          />
          <MessageBubble direction="incoming" text="x" deleted labels={{ deleted: 'Borrado' }} />
        </>,
      );
      expect(el.textContent).toContain('Desde Ana');
      expect(el.textContent).toContain('Borrado');
    });
  });

  describe('chat-screen speaks the app locale', () => {
    it('names the header controls in Spanish, common words included', () => {
      const noop = () => {};
      const el = mount(
        <ChatHeader
          title="Ana"
          showBack
          onPressBack={noop}
          onPressCall={noop}
          onPressVideoCall={noop}
          onPressMore={noop}
        />,
      );
      expect(byLabel(el, 'Atrás')).not.toBeNull();
      expect(byLabel(el, 'Llamar')).not.toBeNull();
      expect(byLabel(el, 'Videollamada')).not.toBeNull();
      expect(byLabel(el, 'Más opciones')).not.toBeNull();
    });

    it('pluralises the selection count (Spanish one / other)', () => {
      const one = mount(<ChatHeader title="Ana" selectionCount={1} onClearSelection={() => {}} />);
      expect(one.textContent).toContain('1 seleccionado');
      const many = mount(<ChatHeader title="Ana" selectionCount={4} onClearSelection={() => {}} />);
      expect(many.textContent).toContain('4 seleccionados');
      expect(byLabel(many, 'Borrar selección')).not.toBeNull();
    });

    it('titles the pinned bar, the empty state, the jump button and a role badge in Spanish', () => {
      const el = mount(
        <>
          <PinnedMessageBar
            pins={[
              { id: 'a', preview: 'uno' },
              { id: 'b', preview: 'dos' },
            ]}
            index={1}
          />
          <ChatEmptyState />
          <ScrollToBottomButton onPress={() => {}} />
          <ChatMemberRow member={{ id: 'm', name: 'Ana', role: 'owner' }} />
        </>,
      );
      expect(el.textContent).toContain('Mensaje fijado n.º 2');
      expect(el.textContent).toContain('Aún no hay mensajes');
      expect(byLabel(el, 'Ir a los mensajes más recientes')).not.toBeNull();
      expect(el.textContent).toContain('Propietario');
    });

    it('lets a *Label prop win over the catalog', () => {
      const el = mount(
        <>
          <ChatHeader title="Ana" onPressCall={() => {}} callLabel="Telefonear" />
          <ChatEmptyState title="Nada por aquí" />
        </>,
      );
      expect(byLabel(el, 'Telefonear')).not.toBeNull();
      expect(el.textContent).toContain('Nada por aquí');
    });
  });
});

describe('message-media', () => {
  const byLabel = (el: HTMLElement, label: string) => el.querySelector(`[aria-label="${label}"]`);

  describe('message-media speaks the app locale', () => {
    it('names a voice message, its seek slider and its transcript toggle in Spanish', () => {
      const el = mount(
        <VoiceMessage
          samples={[0.2, 0.8, 0.4]}
          duration={14}
          transcript="Hola"
          onSeek={() => {}}
        />,
      );
      expect(byLabel(el, 'Mensaje de voz, 0:14')).not.toBeNull();
      expect(byLabel(el, 'Buscar posición')).not.toBeNull();
      expect(byLabel(el, 'Reproducir mensaje de voz')).not.toBeNull();
      expect(el.textContent).toContain('Transcribir');
    });

    it('pluralises the poll footer and the album name', () => {
      const poll = mount(
        <PollMessage question="¿Cena?" options={[{ id: 'a', label: 'Sí', votes: 1 }]} voted />,
      );
      expect(poll.textContent).toContain('1 voto');
      expect(poll.textContent).not.toContain('1 votos');

      const polls = mount(
        <PollMessage question="¿Cena?" options={[{ id: 'a', label: 'Sí', votes: 5 }]} voted />,
      );
      expect(polls.textContent).toContain('5 votos');

      const ru = mount(
        <MediaAlbum
          items={[
            { id: '1', source: 'a' },
            { id: '2', source: 'b' },
            { id: '3', source: 'c' },
          ]}
        />,
        'ru',
      );
      expect(byLabel(ru, 'Альбом, 3 элемента')).not.toBeNull();
      expect(byLabel(ru, 'Фото 1 из 3')).not.toBeNull();
    });

    it('lets a caller label win over the catalog', () => {
      const el = mount(
        <FileMessage name="Contrato.pdf" onDownload={() => {}} downloadLabel="Bajar" />,
      );
      expect(byLabel(el, 'Bajar')).not.toBeNull();
      expect(byLabel(el, 'Descargar')).toBeNull();

      const poll = mount(
        <PollMessage
          question="¿Cena?"
          options={[{ id: 'a', label: 'Sí' }]}
          multiple
          onVote={() => {}}
          voteLabel="Enviar voto"
        />,
      );
      expect(poll.textContent).toContain('Enviar voto');
      expect(poll.textContent).toContain('Elige una o más');
    });
  });
});

describe('chat-people', () => {
  function byTestId(id: string): HTMLElement {
    const el = container.querySelector(`[data-testid="${id}"]`);
    if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
    return el;
  }

  const label = (id: string) => byTestId(id).getAttribute('aria-label');

  describe('chat-people in Spanish', () => {
    it('names the group form, its members and each remove', () => {
      mount(
        <NewGroupForm
          name=""
          onNameChange={() => undefined}
          onPickPhoto={() => undefined}
          members={[{ id: 'a', name: 'Ana Restrepo' }]}
          onRemoveMember={() => undefined}
          testID="f"
        />,
      );
      expect(label('f-photo')).toBe('Elegir foto del grupo');
      expect(byTestId('f-members-title').textContent).toBe('1 miembro');
      expect(label('f-remove-a')).toBe('Quitar a Ana Restrepo');
    });

    it('names roles, the member menu and the list controls', () => {
      mount(
        <MemberRow
          id="a"
          name="Ana"
          role="admin"
          onPress={() => undefined}
          onRemove={() => undefined}
          testID="r"
        />,
      );
      expect(label('r-open')).toBe('Ana, Administrador');
      expect(label('r-actions')).toBe('Acciones de Ana');
    });

    it('draws the add row and the member search in Spanish', () => {
      mount(<MemberList members={[]} onAddMembers={() => undefined} testID="m" />);
      expect(label('m-add')).toBe('Añadir miembros');
    });

    it('names the rail, the contact action and the story strip', () => {
      mount(
        <ContactList
          sections={[
            { letter: 'A', contacts: [{ id: 'a', name: 'Ana' }] },
            { letter: 'K', contacts: [{ id: 'k', name: 'Kofi' }] },
          ]}
          onJumpToLetter={() => undefined}
          testID="l"
        />,
      );
      expect(label('l-jump-K')).toBe('Ir a la K');
      mount(<ContactRow id="a" name="Ana" onAction={() => undefined} testID="c" />);
      expect(label('c-action')).toBe('Añadir: Ana');
      mount(<StoryProgressBars count={5} index={1} progress={0.5} testID="s" />);
      expect(label('s')).toBe('Historia 2 de 5');
    });

    it('names a post’s counts and controls', () => {
      mount(
        <ChannelPostCard
          channelName="Canal"
          time="12:41"
          views="1"
          forwards="318"
          onShare={() => undefined}
          testID="p"
        />,
      );
      expect(label('p-views')).toBe('1 visualización');
      expect(label('p-forwards')).toBe('318 reenvíos');
      expect(label('p-share')).toBe('Compartir');
    });
  });

  describe('chat-people plurals', () => {
    it('follows each language’s categories', () => {
      const count = (lang: BloomLanguage, n: number) =>
        messagesIn(CHAT_PEOPLE_MESSAGES, lang).newGroup.members(n);
      expect(count('es', 3)).toBe('3 miembros');
      expect(count('fr', 0)).toBe('0 membre');
      expect(count('ru', 1)).toBe('1 участник');
      expect(count('ru', 3)).toBe('3 участника');
      expect(count('ru', 5)).toBe('5 участников');
      expect(count('ar', 2)).toBe('عضوان');
      expect(count('ar', 11)).toBe('11 عضوًا');
      expect(messagesIn(CHAT_PEOPLE_MESSAGES, 'ru').views('12.4K')).toBe('12.4K просмотров');
    });

    it('renders the Russian few form in the group form', () => {
      mount(
        <NewGroupForm
          name=""
          onNameChange={() => undefined}
          members={[
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
            { id: 'c', name: 'C' },
          ]}
          testID="f"
        />,
        'ru',
      );
      expect(byTestId('f-members-title').textContent).toBe('3 участника');
    });
  });

  describe('chat-people overrides win over the catalog', () => {
    it('keeps a caller’s labels and *Label props', () => {
      mount(
        <NewGroupForm
          name=""
          onNameChange={() => undefined}
          onPickPhoto={() => undefined}
          labels={{ photo: 'Foto del equipo' }}
          testID="f"
        />,
      );
      expect(label('f-photo')).toBe('Foto del equipo');
      mount(
        <MemberList
          members={[]}
          onAddMembers={() => undefined}
          addMembersLabel="Invitar"
          testID="m"
        />,
      );
      expect(label('m-add')).toBe('Invitar');
      mount(
        <ContactRow
          id="a"
          name="Ana"
          onAction={() => undefined}
          actionDone
          actionDoneLabel="Invitada"
          testID="c"
        />,
      );
      expect(byTestId('c-action-done').textContent).toBe('Invitada');
    });
  });
});

describe('chat-composer', () => {
  const labelled = (el: HTMLElement, name: string) => el.querySelector(`[aria-label="${name}"]`);

  describe('chat-composer in Spanish', () => {
    it('names the composer controls and the field in the locale', () => {
      const el = mount(
        <ChatComposer onAttachPress={() => {}} onMicPress={() => {}} onSend={() => {}} />,
      );
      expect(labelled(el, 'Adjuntar')).not.toBeNull();
      expect(labelled(el, 'Grabar un mensaje de voz')).not.toBeNull();
      expect(labelled(el, 'Enviar')).not.toBeNull();
      expect(el.querySelector('[placeholder="Mensaje"]')).not.toBeNull();
      expect(labelled(el, 'Attach')).toBeNull();
    });

    it('keeps a caller label and placeholder over the catalog', () => {
      const el = mount(
        <ChatComposer
          onAttachPress={() => {}}
          placeholder="Escribe algo"
          labels={{ attach: 'Añadir archivo' }}
        />,
      );
      expect(labelled(el, 'Añadir archivo')).not.toBeNull();
      expect(el.querySelector('[placeholder="Escribe algo"]')).not.toBeNull();
    });

    it('names the recorder, the reaction bar and the emoji picker', () => {
      let el = mount(
        <VoiceRecorder
          state="recording"
          seconds={3}
          onCancel={() => {}}
          onSend={() => {}}
          slideToCancel={false}
        />,
      );
      expect(labelled(el, 'Cancelar grabación')).not.toBeNull();
      el = mount(
        <VoiceRecorder
          state="preview"
          seconds={3}
          onDelete={() => {}}
          onSend={() => {}}
          onPlayToggle={() => {}}
        />,
      );
      expect(labelled(el, 'Enviar mensaje de voz')).not.toBeNull();
      expect(labelled(el, 'Eliminar grabación')).not.toBeNull();

      el = mount(<ReactionPicker onMorePress={() => {}} />);
      expect(labelled(el, 'Reacciones rápidas')).not.toBeNull();
      expect(labelled(el, 'Más reacciones')).not.toBeNull();

      el = mount(<EmojiPicker groups={[{ key: 'smileys', label: 'Caras', emojis: ['😀'] }]} />);
      expect(labelled(el, 'Selector de emojis')).not.toBeNull();
      expect(el.querySelector('[placeholder="Buscar emoji"]')).not.toBeNull();
    });

    it('puts the name where each language puts it, and lets removeLabel win', () => {
      const attachment = { id: 'a', name: 'foto.jpg', source: 'https://x/y.jpg' };
      let el = mount(<ComposerAttachmentStrip attachments={[attachment]} onRemove={() => {}} />);
      expect(labelled(el, 'Quitar foto.jpg')).not.toBeNull();
      expect(labelled(el, 'Archivos adjuntos')).not.toBeNull();

      el = mount(<ComposerAttachmentStrip attachments={[attachment]} onRemove={() => {}} />, 'de');
      expect(labelled(el, 'foto.jpg entfernen')).not.toBeNull();

      el = mount(
        <ComposerAttachmentStrip
          attachments={[attachment]}
          onRemove={() => {}}
          removeLabel={(a) => `Borrar ${a.name}`}
        />,
      );
      expect(labelled(el, 'Borrar foto.jpg')).not.toBeNull();
    });

    it('keeps the exported English attachment rows, and localises the default rows', () => {
      expect(ATTACHMENT_MENU_ITEMS.map((item) => item.label)).toEqual([
        'Gallery',
        'Camera',
        'File',
        'Location',
        'Contact',
        'Poll',
        'Music',
      ]);
      expect(
        attachmentMenuItems(messagesIn(CHAT_COMPOSER_MESSAGES, 'es')).map((item) => item.label),
      ).toEqual(['Galería', 'Cámara', 'Archivo', 'Ubicación', 'Contacto', 'Encuesta', 'Música']);
    });
  });
});

describe('chat-list', () => {
  const labelled = (name: string) => container.querySelector(`[aria-label="${name}"]`);
  const text = () => container.textContent ?? '';

  describe('chat-list in Spanish', () => {
    it('names a row with its glyph states, unread count and draft in Spanish', () => {
      mount(
        <ChatListItem
          name="Ana"
          verified
          preview={{ draft: true, text: 'nos vemos' }}
          time="12:41"
          unreadCount={3}
          muted
          pinned
          testID="row"
        />,
      );
      expect(
        labelled(
          'Ana, Verificado, Borrador: nos vemos, 12:41, 3 mensajes no leídos, Silenciado, Fijado',
        ),
      ).not.toBeNull();
      expect(text()).toContain('Borrador:');
    });

    it('names the delivery ticks in Spanish once nothing is unread', () => {
      mount(<ChatListItem name="Ana" outgoingStatus="read" testID="row" />);
      expect(labelled('Ana, Leído')).not.toBeNull();
    });

    it('draws the empty list, the search field and the results region in Spanish', () => {
      mount(
        <>
          <ChatList chats={[]} />
          <ChatSearchField value="x" onChangeText={() => {}} onClear={() => {}} />
          <ChatSearchResults query="zz" results={[]} />
          <NewChatButton onPress={() => {}} />
        </>,
      );
      expect(text()).toContain('Aún no hay conversaciones');
      expect(text()).toContain('Sin resultados');
      expect(labelled('Chats')).not.toBeNull();
      expect(labelled('Buscar chats')).not.toBeNull();
      expect(labelled('Borrar búsqueda')).not.toBeNull();
      expect(labelled('Resultados de búsqueda')).not.toBeNull();
      expect(labelled('Nuevo chat')).not.toBeNull();
    });

    it('pluralises the archived count and the folder unread count', () => {
      mount(
        <>
          <ArchivedRow count={1} onPress={() => {}} />
          <ChatFolderTabs
            folders={[{ key: 'w', label: 'Trabajo', unreadCount: 5 }]}
            accessibilityLabel="Carpetas"
          />
        </>,
      );
      expect(labelled('Archivados, 1 chat')).not.toBeNull();
      expect(labelled('Trabajo, 5 sin leer')).not.toBeNull();
    });

    it('pluralises the archived count in Russian', () => {
      mount(<ArchivedRow count={3} onPress={() => {}} />, 'ru');
      expect(labelled('Архив, 3 чата')).not.toBeNull();
      mount(<ArchivedRow count={5} onPress={() => {}} />, 'ru');
      expect(labelled('Архив, 5 чатов')).not.toBeNull();
    });

    it('names the stories row and a story ring in Spanish', () => {
      mount(
        <StoriesRow
          own={{}}
          onOwnPress={() => {}}
          stories={[{ id: '1', name: 'Ana', state: 'unseen' }]}
          onStoryPress={() => {}}
        />,
      );
      expect(labelled('Historias')).not.toBeNull();
      expect(labelled('Historia de Ana')).not.toBeNull();
      expect(labelled('Añadir a tu historia')).not.toBeNull();
      expect(text()).toContain('Tu historia');
    });
  });

  describe('a caller prop still wins', () => {
    it('keeps labels and *Label props over the catalog', () => {
      mount(
        <>
          <ChatListItem name="Ana" pinned labels={{ pinned: 'Anclado' }} />
          <ChatList
            chats={[]}
            labels={{ emptyTitle: 'Nada por aquí' }}
            accessibilityLabel="Conversaciones"
          />
          <ArchivedRow label="Guardados" onPress={() => {}} />
        </>,
      );
      expect(labelled('Ana, Anclado')).not.toBeNull();
      expect(text()).toContain('Nada por aquí');
      expect(labelled('Conversaciones')).not.toBeNull();
      expect(text()).toContain('Guardados');
    });
  });
});
