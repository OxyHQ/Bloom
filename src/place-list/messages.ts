import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';
import type { PlaceListLabels, PlaceListVisibility } from './types';

/**
 * Every fixed string the place-list family draws or announces, in each Bloom
 * language. A caller's `labels`/`*Label` props still win, one key at a time.
 */
export interface PlaceListMessages {
  /** The visibility badge. */
  visibility: Readonly<Record<PlaceListVisibility, string>>;
  /** "12 places". */
  places: (count: number) => string;
  /** "Shared with 3". */
  sharedWith: (count: number) => string;
  /** `PlaceList`'s controls, its note and its move announcement. */
  labels: PlaceListLabels;
  /** Names `PlaceList`. */
  savedPlaces: string;
}

export const PLACE_LIST_MESSAGES: MessageCatalog<PlaceListMessages> = {
  en: {
    visibility: { private: 'Private', shared: 'Shared', public: 'Public' },
    places: (n) => plural('en', n, { one: '{n} place', other: '{n} places' }),
    sharedWith: (n) => `Shared with ${n}`,
    labels: {
      moveEarlier: (position) => `Move to position ${position - 1}`,
      moveLater: (position) => `Move to position ${position + 1}`,
      remove: (name) => `Remove ${name} from the list`,
      moved: (name, position, total) => `${name} moved to position ${position} of ${total}`,
      note: 'Note',
    },
    savedPlaces: 'Saved places',
  },
  es: {
    visibility: { private: 'Privada', shared: 'Compartida', public: 'Pública' },
    places: (n) => plural('es', n, { one: '{n} lugar', other: '{n} lugares' }),
    sharedWith: (n) => plural('es', n, { one: 'Compartida con {n} persona', other: 'Compartida con {n} personas' }),
    labels: {
      moveEarlier: (position) => `Mover a la posición ${position - 1}`,
      moveLater: (position) => `Mover a la posición ${position + 1}`,
      remove: (name) => `Quitar ${name} de la lista`,
      moved: (name, position, total) => `${name} se ha movido a la posición ${position} de ${total}`,
      note: 'Nota',
    },
    savedPlaces: 'Lugares guardados',
  },
  ca: {
    visibility: { private: 'Privada', shared: 'Compartida', public: 'Pública' },
    places: (n) => plural('ca', n, { one: '{n} lloc', other: '{n} llocs' }),
    sharedWith: (n) => plural('ca', n, { one: 'Compartida amb {n} persona', other: 'Compartida amb {n} persones' }),
    labels: {
      moveEarlier: (position) => `Mou a la posició ${position - 1}`,
      moveLater: (position) => `Mou a la posició ${position + 1}`,
      remove: (name) => `Treu ${name} de la llista`,
      moved: (name, position, total) => `${name} s'ha mogut a la posició ${position} de ${total}`,
      note: 'Nota',
    },
    savedPlaces: 'Llocs desats',
  },
  de: {
    visibility: { private: 'Privat', shared: 'Geteilt', public: 'Öffentlich' },
    places: (n) => plural('de', n, { one: '{n} Ort', other: '{n} Orte' }),
    sharedWith: (n) => plural('de', n, { one: 'Geteilt mit {n} Person', other: 'Geteilt mit {n} Personen' }),
    labels: {
      moveEarlier: (position) => `An Position ${position - 1} verschieben`,
      moveLater: (position) => `An Position ${position + 1} verschieben`,
      remove: (name) => `${name} aus der Liste entfernen`,
      moved: (name, position, total) => `${name} an Position ${position} von ${total} verschoben`,
      note: 'Notiz',
    },
    savedPlaces: 'Gespeicherte Orte',
  },
  fr: {
    visibility: { private: 'Privée', shared: 'Partagée', public: 'Publique' },
    places: (n) => plural('fr', n, { one: '{n} lieu', other: '{n} lieux' }),
    sharedWith: (n) => plural('fr', n, { one: 'Partagée avec {n} personne', other: 'Partagée avec {n} personnes' }),
    labels: {
      moveEarlier: (position) => `Déplacer en position ${position - 1}`,
      moveLater: (position) => `Déplacer en position ${position + 1}`,
      remove: (name) => `Retirer ${name} de la liste`,
      moved: (name, position, total) => `${name} déplacé en position ${position} sur ${total}`,
      note: 'Note',
    },
    savedPlaces: 'Lieux enregistrés',
  },
  it: {
    visibility: { private: 'Privata', shared: 'Condivisa', public: 'Pubblica' },
    places: (n) => plural('it', n, { one: '{n} luogo', other: '{n} luoghi' }),
    sharedWith: (n) => plural('it', n, { one: 'Condivisa con {n} persona', other: 'Condivisa con {n} persone' }),
    labels: {
      moveEarlier: (position) => `Sposta in posizione ${position - 1}`,
      moveLater: (position) => `Sposta in posizione ${position + 1}`,
      remove: (name) => `Rimuovi ${name} dall'elenco`,
      moved: (name, position, total) => `${name} spostato in posizione ${position} di ${total}`,
      note: 'Nota',
    },
    savedPlaces: 'Luoghi salvati',
  },
  pt: {
    visibility: { private: 'Privada', shared: 'Compartilhada', public: 'Pública' },
    places: (n) => plural('pt', n, { one: '{n} lugar', other: '{n} lugares' }),
    sharedWith: (n) => plural('pt', n, { one: 'Compartilhada com {n} pessoa', other: 'Compartilhada com {n} pessoas' }),
    labels: {
      moveEarlier: (position) => `Mover para a posição ${position - 1}`,
      moveLater: (position) => `Mover para a posição ${position + 1}`,
      remove: (name) => `Remover ${name} da lista`,
      moved: (name, position, total) => `${name} movido para a posição ${position} de ${total}`,
      note: 'Nota',
    },
    savedPlaces: 'Lugares salvos',
  },
  ru: {
    visibility: { private: 'Личный', shared: 'Общий', public: 'Публичный' },
    places: (n) => plural('ru', n, { one: '{n} место', few: '{n} места', many: '{n} мест', other: '{n} места' }),
    sharedWith: (n) => plural('ru', n, { one: 'Доступ открыт {n} человеку', few: 'Доступ открыт {n} людям', many: 'Доступ открыт {n} людям', other: 'Доступ открыт {n} людям' }),
    labels: {
      moveEarlier: (position) => `Переместить на позицию ${position - 1}`,
      moveLater: (position) => `Переместить на позицию ${position + 1}`,
      remove: (name) => `Убрать «${name}» из списка`,
      moved: (name, position, total) => `«${name}» перемещено на позицию ${position} из ${total}`,
      note: 'Заметка',
    },
    savedPlaces: 'Сохранённые места',
  },
  tr: {
    visibility: { private: 'Gizli', shared: 'Paylaşılan', public: 'Herkese açık' },
    places: (n) => plural('tr', n, { other: '{n} yer' }),
    sharedWith: (n) => plural('tr', n, { other: '{n} kişiyle paylaşıldı' }),
    labels: {
      moveEarlier: (position) => `${position - 1}. sıraya taşı`,
      moveLater: (position) => `${position + 1}. sıraya taşı`,
      remove: (name) => `${name} öğesini listeden kaldır`,
      moved: (name, position, total) => `${name}, ${total} öğe içinde ${position}. sıraya taşındı`,
      note: 'Not',
    },
    savedPlaces: 'Kaydedilen yerler',
  },
  ja: {
    visibility: { private: '非公開', shared: '共有', public: '公開' },
    places: (n) => plural('ja', n, { other: '{n}か所' }),
    sharedWith: (n) => plural('ja', n, { other: '{n}人と共有' }),
    labels: {
      moveEarlier: (position) => `${position - 1}番目に移動`,
      moveLater: (position) => `${position + 1}番目に移動`,
      remove: (name) => `${name}をリストから削除`,
      moved: (name, position, total) => `${name}を${total}件中${position}番目に移動しました`,
      note: 'メモ',
    },
    savedPlaces: '保存済みの場所',
  },
  zh: {
    visibility: { private: '私密', shared: '已共享', public: '公开' },
    places: (n) => plural('zh', n, { other: '{n} 个地点' }),
    sharedWith: (n) => plural('zh', n, { other: '已与 {n} 人共享' }),
    labels: {
      moveEarlier: (position) => `移到第 ${position - 1} 位`,
      moveLater: (position) => `移到第 ${position + 1} 位`,
      remove: (name) => `从列表中移除${name}`,
      moved: (name, position, total) => `已将${name}移到第 ${position} 位（共 ${total} 位）`,
      note: '备注',
    },
    savedPlaces: '已保存的地点',
  },
  ar: {
    visibility: { private: 'خاصة', shared: 'مشتركة', public: 'عامة' },
    places: (n) => plural('ar', n, { zero: 'لا توجد أماكن', one: 'مكان واحد', two: 'مكانان', few: '{n} أماكن', many: '{n} مكانًا', other: '{n} مكان' }),
    sharedWith: (n) => plural('ar', n, { one: 'تمت مشاركتها مع شخص واحد', two: 'تمت مشاركتها مع شخصين', few: 'تمت مشاركتها مع {n} أشخاص', many: 'تمت مشاركتها مع {n} شخصًا', other: 'تمت مشاركتها مع {n} شخص' }),
    labels: {
      moveEarlier: (position) => `نقل إلى الموضع ${position - 1}`,
      moveLater: (position) => `نقل إلى الموضع ${position + 1}`,
      remove: (name) => `إزالة ${name} من القائمة`,
      moved: (name, position, total) => `تم نقل ${name} إلى الموضع ${position} من ${total}`,
      note: 'ملاحظة',
    },
    savedPlaces: 'الأماكن المحفوظة',
  },
  hi: {
    visibility: { private: 'निजी', shared: 'शेयर की गई', public: 'सार्वजनिक' },
    places: (n) => plural('hi', n, { one: '{n} जगह', other: '{n} जगहें' }),
    sharedWith: (n) => plural('hi', n, { one: '{n} व्यक्ति के साथ शेयर की गई', other: '{n} लोगों के साथ शेयर की गई' }),
    labels: {
      moveEarlier: (position) => `स्थान ${position - 1} पर ले जाएँ`,
      moveLater: (position) => `स्थान ${position + 1} पर ले जाएँ`,
      remove: (name) => `${name} को सूची से निकालें`,
      moved: (name, position, total) => `${name} को ${total} में से स्थान ${position} पर ले जाया गया`,
      note: 'नोट',
    },
    savedPlaces: 'सहेजी गई जगहें',
  },
  bn: {
    visibility: { private: 'ব্যক্তিগত', shared: 'শেয়ার করা', public: 'সর্বজনীন' },
    places: (n) => plural('bn', n, { other: '{n}টি জায়গা' }),
    sharedWith: (n) => plural('bn', n, { other: '{n} জনের সাথে শেয়ার করা' }),
    labels: {
      moveEarlier: (position) => `${position - 1} নম্বর অবস্থানে সরান`,
      moveLater: (position) => `${position + 1} নম্বর অবস্থানে সরান`,
      remove: (name) => `তালিকা থেকে ${name} সরান`,
      moved: (name, position, total) => `${name} ${total}টির মধ্যে ${position} নম্বর অবস্থানে সরানো হয়েছে`,
      note: 'নোট',
    },
    savedPlaces: 'সংরক্ষিত জায়গা',
  },
  id: {
    visibility: { private: 'Pribadi', shared: 'Dibagikan', public: 'Publik' },
    places: (n) => plural('id', n, { other: '{n} tempat' }),
    sharedWith: (n) => plural('id', n, { other: 'Dibagikan dengan {n} orang' }),
    labels: {
      moveEarlier: (position) => `Pindahkan ke posisi ${position - 1}`,
      moveLater: (position) => `Pindahkan ke posisi ${position + 1}`,
      remove: (name) => `Hapus ${name} dari daftar`,
      moved: (name, position, total) => `${name} dipindahkan ke posisi ${position} dari ${total}`,
      note: 'Catatan',
    },
    savedPlaces: 'Tempat tersimpan',
  },
};
