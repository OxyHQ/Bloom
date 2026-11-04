import { defineMessages, type MessageCatalog } from '../locale/messages';

/** The ready-made preference rows' text, in each Bloom language. */
export interface PreferencesMessages {
  haptics: string;
  hapticsDescription: string;
  hapticsUnavailable: string;
  videoAutoplay: string;
  videoAutoplayDescription: string;
  autoplayAlways: string;
  autoplayWifi: string;
  autoplayNever: string;
}

export const PREFERENCES_MESSAGES: MessageCatalog<PreferencesMessages> =
  defineMessages<PreferencesMessages>('PREFERENCES_MESSAGES', {
    haptics: 'Haptic feedback',
    hapticsDescription: 'Vibration feedback on interactions',
    hapticsUnavailable: 'Available in the mobile app.',
    videoAutoplay: 'Autoplay videos',
    videoAutoplayDescription: 'Videos you start yourself always play.',
    autoplayAlways: 'Always',
    autoplayWifi: 'On Wi-Fi only',
    autoplayNever: 'Never',
  });
