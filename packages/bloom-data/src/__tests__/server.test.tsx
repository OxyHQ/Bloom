/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';
import { DataProvider, source, Store, useEntity, useList } from '../index';
import { Feed, Post, post } from './fixtures';

describe('server render', () => {
  it('renders from a request’s own store with no browser, timers or disk', () => {
    const request = new Store();
    request.put(Post.definition, post('1', { text: 'from the server' }) as never);
    const feed = source(Feed, {
      key: (type: string) => type,
      load: async () => ({ items: [] }),
    });
    function Page() {
      const view = useList(feed, 'home');
      return (
        <>
          {useEntity(Post, '1')?.text}|{view.isLoading ? 'loading' : 'ready'}
        </>
      );
    }
    const html = renderToString(
      <DataProvider store={request}>
        <Page />
      </DataProvider>,
    );
    expect(html).toBe('from the server<!-- -->|<!-- -->loading');
    // Effects do not run on the server, so nothing was read.
    expect(feed.stateIn(request, ['home']).status).toBe('idle');
  });
});
