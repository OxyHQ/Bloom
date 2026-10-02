import type { ComponentType, Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type CharacterWebViewHandle = { injectJavaScript(script: string): void };
type Props = {
  ref?: Ref<CharacterWebViewHandle>;
  source: { html: string; baseUrl: string };
  style: StyleProp<ViewStyle>;
  scrollEnabled: boolean;
  javaScriptEnabled: boolean;
  originWhitelist: string[];
  onMessage(event: { nativeEvent: { data: string } }): void;
};
let cached: ComponentType<Props> | null | undefined;
export function characterWebView() {
  if (cached !== undefined) return cached;
  try {
    const module = require('react-native-webview');
    cached = module.WebView as ComponentType<Props>;
  } catch {
    cached = null;
  }
  return cached;
}
