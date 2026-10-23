import { ServerStyleSheet } from './ServerStyleSheet';
import { useServerStyleText } from './use-server-style-text';

/** Resolve a recipe sheet only when its owner actually renders the sheet. */
export function ServerStyleSheetFactory({
  id,
  server,
  client,
  liveReady,
  reuseServer,
}: {
  id: string;
  server: () => string;
  client: () => string;
  liveReady: boolean;
  reuseServer: boolean;
}) {
  const css = useServerStyleText(id, server, client, liveReady, reuseServer);
  return css ? <ServerStyleSheet id={id} css={css} owned /> : null;
}
