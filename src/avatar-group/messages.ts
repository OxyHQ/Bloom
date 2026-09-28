import type { MessageCatalog } from '../locale/messages';
import { plural } from '../locale/plural';

/** Every fixed string the avatar-group family announces, in each Bloom language. */
export interface AvatarGroupMessages {
  /** Names the pressable `+N` overflow chip: the people not shown. */
  more: (count: number) => string;
  /** Names a member's hover card when the member has no name. */
  profile: string;
}

export const AVATAR_GROUP_MESSAGES: MessageCatalog<AvatarGroupMessages> = {
  en: { more: (n) => `${n} more`, profile: 'Profile' },
  es: { more: (n) => plural('es', n, { one: '{n} persona más', other: '{n} personas más' }), profile: 'Perfil' },
  ca: { more: (n) => plural('ca', n, { one: '{n} persona més', other: '{n} persones més' }), profile: 'Perfil' },
  de: { more: (n) => plural('de', n, { one: '{n} weitere Person', other: '{n} weitere Personen' }), profile: 'Profil' },
  fr: { more: (n) => plural('fr', n, { one: '{n} autre personne', other: '{n} autres personnes' }), profile: 'Profil' },
  it: { more: (n) => plural('it', n, { one: '{n} altra persona', other: 'altre {n} persone' }), profile: 'Profilo' },
  pt: { more: (n) => plural('pt', n, { one: 'mais {n} pessoa', other: 'mais {n} pessoas' }), profile: 'Perfil' },
  ru: {
    more: (n) => plural('ru', n, { one: 'ещё {n} человек', few: 'ещё {n} человека', many: 'ещё {n} человек', other: 'ещё {n} человека' }),
    profile: 'Профиль',
  },
  tr: { more: (n) => `${n} kişi daha`, profile: 'Profil' },
  ja: { more: (n) => `他${n}人`, profile: 'プロフィール' },
  zh: { more: (n) => `还有 ${n} 人`, profile: '个人资料' },
  ar: {
    more: (n) =>
      plural('ar', n, {
        zero: 'لا أحد آخر',
        one: 'شخص آخر',
        two: 'شخصان آخران',
        few: '{n} أشخاص آخرين',
        many: '{n} شخصًا آخر',
        other: '{n} شخص آخر',
      }),
    profile: 'الملف الشخصي',
  },
  hi: { more: (n) => `${n} और लोग`, profile: 'प्रोफ़ाइल' },
  bn: { more: (n) => `আরও ${n} জন`, profile: 'প্রোফাইল' },
  id: { more: (n) => `${n} orang lainnya`, profile: 'Profil' },
};
