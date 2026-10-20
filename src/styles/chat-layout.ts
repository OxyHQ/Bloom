import type { ViewStyle } from 'react-native';

/** Shared reading measure for AI conversations and their composers. */
export const CHAT_CONTENT_MAX_WIDTH = 768;
export const CHAT_CONTENT_STYLE: ViewStyle = {
  width: '100%',
  maxWidth: CHAT_CONTENT_MAX_WIDTH,
  alignSelf: 'center',
};
