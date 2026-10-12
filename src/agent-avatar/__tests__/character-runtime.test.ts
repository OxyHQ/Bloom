/** @jest-environment node */
import { characterHtml, scriptJson } from '../character-html';

it('keeps saved configuration from terminating the native module script', () => {
  const payload = {
    config: { character: { preset: '</script><script>unexpected()</script>' } },
  };
  const escaped = scriptJson(payload);
  expect(JSON.parse(escaped)).toEqual(payload);
  expect(escaped).not.toContain('<');
  const html = characterHtml('https://example.test/runtime.mjs?x=</script>', payload);
  expect(html.match(/<script\b/g)).toHaveLength(1);
  expect(html.match(/<\/script>/g)).toHaveLength(1);
  expect(html).toContain('window.captureAvatar');
  expect(html).toContain("toDataURL('image/png')");
  expect(html).toContain('controller?.dispose()');
});
