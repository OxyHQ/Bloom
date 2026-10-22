import { Platform } from 'react-native';
import { getThemeBootstrap, type BloomThemeBootstrapConfig } from './prepaint';

/** Place in the document head, before body content; the host authorizes inline CSP resources. */
export function BloomThemeHead({
  config,
  nonce,
}: {
  config: BloomThemeBootstrapConfig;
  nonce?: string;
}) {
  if (Platform.OS !== 'web') return null;
  const { css, script } = getThemeBootstrap(config);
  return (
    <>
      <style data-bloom-theme-bootstrap="" nonce={nonce}>
        {css}
      </style>
      <script data-bloom-theme-bootstrap="" nonce={nonce}>
        {script}
      </script>
    </>
  );
}
