import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The patient card's fixed words in each Bloom language. `addPhotoLabel` still wins. */
export interface PatientInfoCardMessages {
  /** The `+` button's name. */
  addPhoto: string;
}

export const PATIENT_INFO_CARD_MESSAGES: MessageCatalog<PatientInfoCardMessages> = defineMessages<PatientInfoCardMessages>('PATIENT_INFO_CARD_MESSAGES', { addPhoto: 'Add profile photo' });
