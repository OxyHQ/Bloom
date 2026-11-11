import { panelContentResizeLimit, resizePanelPair } from '../app-shell/panel-layout';

const main = { id: 'main', minWidth: 160 };
const likes = { id: 'likes', minWidth: 120 };

it('does not jump an initially oversized pane and cannot enlarge its empty area', () => {
  const limit = panelContentResizeLimit(likes, 438, 180);
  expect(resizePanelPair(main, limit, 438, 438, 438)).toEqual({ main: 438, likes: 438 });
  expect(resizePanelPair(main, limit, 438, 438, 300)).toEqual({ main: 438, likes: 438 });
  const smaller = resizePanelPair(main, limit, 438, 438, 576);
  expect(smaller).toEqual({ main: 576, likes: 300 });
  const nextLimit = panelContentResizeLimit(likes, smaller.likes!, 180);
  expect(resizePanelPair(main, nextLimit, 438, 438, 500)).toEqual({ main: 576, likes: 300 });
});
it('allows ordinary resizing below the content ceiling after reaching it', () => {
  const limit = panelContentResizeLimit(likes, 150, 180);
  expect(resizePanelPair(main, limit, 438, 438, 620)).toEqual({ main: 696, likes: 180 });
  expect(resizePanelPair(main, limit, 438, 438, 900)).toEqual({ main: 756, likes: 120 });
});
it('honors minimums, authored maxima and the real shared available space', () => {
  expect(panelContentResizeLimit(likes, 120, 60).maxWidth).toBe(120);
  const limit = panelContentResizeLimit({ ...likes, maxWidth: 300 }, 200, 2000);
  expect(resizePanelPair(main, limit, 438, 438, 0)).toEqual({ main: 576, likes: 300 });
  const long = panelContentResizeLimit(likes, 438, 2000);
  expect(resizePanelPair(main, long, 438, 438, 0)).toEqual({ main: 160, likes: 716 });
});
it('keeps the existing constraints when no reliable intrinsic measurement exists', () => {
  for (const maximum of [undefined, -1, Number.NaN, Infinity])
    expect(panelContentResizeLimit(likes, 438, maximum)).toBe(likes);
});
