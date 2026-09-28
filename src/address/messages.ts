import type { MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the address family draws or announces, in each Bloom
 * language. A caller's `emptyTitle`/`accessibilityLabel` still wins.
 */
export interface AddressMessages {
  /** `AddressList`'s empty state. */
  emptyTitle: string;
  /** Names `AddressList`. */
  addresses: string;
}

export const ADDRESS_MESSAGES: MessageCatalog<AddressMessages> = {
  en: { emptyTitle: 'Nothing here yet', addresses: 'Addresses' },
  es: { emptyTitle: 'Aún no hay nada aquí', addresses: 'Direcciones' },
  ca: { emptyTitle: 'Encara no hi ha res', addresses: 'Adreces' },
  de: { emptyTitle: 'Noch nichts vorhanden', addresses: 'Adressen' },
  fr: { emptyTitle: 'Rien pour le moment', addresses: 'Adresses' },
  it: { emptyTitle: 'Ancora niente qui', addresses: 'Indirizzi' },
  pt: { emptyTitle: 'Nada aqui ainda', addresses: 'Endereços' },
  ru: { emptyTitle: 'Здесь пока ничего нет', addresses: 'Адреса' },
  tr: { emptyTitle: 'Burada henüz bir şey yok', addresses: 'Adresler' },
  ja: { emptyTitle: 'まだ何もありません', addresses: '住所' },
  zh: { emptyTitle: '这里还没有内容', addresses: '地址' },
  ar: { emptyTitle: 'لا يوجد شيء هنا بعد', addresses: 'العناوين' },
  hi: { emptyTitle: 'यहाँ अभी कुछ नहीं है', addresses: 'पते' },
  bn: { emptyTitle: 'এখানে এখনও কিছু নেই', addresses: 'ঠিকানা' },
  id: { emptyTitle: 'Belum ada apa pun di sini', addresses: 'Alamat' },
};
