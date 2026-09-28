import type { MessageCatalog } from '../locale/messages';

/** The patient card's fixed words in each Bloom language. `addPhotoLabel` still wins. */
export interface PatientInfoCardMessages {
  /** The `+` button's name. */
  addPhoto: string;
}

export const PATIENT_INFO_CARD_MESSAGES: MessageCatalog<PatientInfoCardMessages> = {
  en: { addPhoto: 'Add profile photo' },
  es: { addPhoto: 'Añadir foto de perfil' },
  ca: { addPhoto: 'Afegeix una foto de perfil' },
  de: { addPhoto: 'Profilfoto hinzufügen' },
  fr: { addPhoto: 'Ajouter une photo de profil' },
  it: { addPhoto: 'Aggiungi foto profilo' },
  pt: { addPhoto: 'Adicionar foto de perfil' },
  ru: { addPhoto: 'Добавить фото профиля' },
  tr: { addPhoto: 'Profil fotoğrafı ekle' },
  ja: { addPhoto: 'プロフィール写真を追加' },
  zh: { addPhoto: '添加头像' },
  ar: { addPhoto: 'إضافة صورة الملف الشخصي' },
  hi: { addPhoto: 'प्रोफ़ाइल फ़ोटो जोड़ें' },
  bn: { addPhoto: 'প্রোফাইল ছবি যোগ করুন' },
  id: { addPhoto: 'Tambahkan foto profil' },
};
