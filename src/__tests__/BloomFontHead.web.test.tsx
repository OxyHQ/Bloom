/** @jest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server';
import { BloomFontHead } from '../fonts/BloomFontHead.web';
import { BloomFontHead as InertFontHead } from '../fonts/BloomFontHead';
import { FONT_FACE_CSS } from '../fonts/font-face-css.web';

jest.mock('../fonts/font-urls.web', () => ({
  interVariable: '/assets/inter-content-hash.woff2',
  blomusModernusRegular: '/assets/display-regular-content-hash.woff2',
  blomusModernusBold: '/assets/display-bold-content-hash.woff2',
  jetbrainsMonoVariable: '/assets/mono-content-hash.woff2',
}));

it('discovers exactly the three default UI fonts in the document head before CSS', () => {
  const html = renderToStaticMarkup(
    <html lang="en">
      <head>
        <BloomFontHead />
        <link rel="stylesheet" href="/global.css" />
      </head>
      <body>Mailbox</body>
    </html>,
  );
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const links = [...parsed.head.querySelectorAll('link[rel="preload"]')];
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/assets/inter-content-hash.woff2',
    '/assets/display-regular-content-hash.woff2',
    '/assets/display-bold-content-hash.woff2',
  ]);
  for (const link of links) {
    expect(link.getAttribute('as')).toBe('font');
    expect(link.getAttribute('type')).toBe('font/woff2');
    expect(link.getAttribute('crossorigin')).toBe('anonymous');
    const href = link.getAttribute('href') ?? '';
    expect(FONT_FACE_CSS).toContain(`url("${href}")`);
    expect(html.indexOf(href)).toBeLessThan(html.indexOf('/global.css'));
  }
  expect(parsed.body.textContent).toBe('Mailbox');
  expect(parsed.body.querySelector('link')).toBeNull();
});

it('preloads only requested families, without duplicate requests for repeated choices', () => {
  const html = renderToStaticMarkup(<BloomFontHead families={['sans', 'mono', 'sans']} />);
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  expect([...parsed.querySelectorAll('link')].map((link) => link.getAttribute('href'))).toEqual([
    '/assets/inter-content-hash.woff2',
    '/assets/mono-content-hash.woff2',
  ]);
  expect(renderToStaticMarkup(<BloomFontHead families={[]} />)).toBe('');
});

it('keeps native and unbundled Node document resources inert', () => {
  expect(renderToStaticMarkup(<InertFontHead />)).toBe('');
});
