import { DataProvider, setActiveStore, Store, useEntities } from '../index';
import { Post, post, User } from './fixtures';
import { render, update } from './support/render';

describe('useEntities', () => {
  it('reads several records in order, re-rendering when one of them or a ref changes', () => {
    const store = new Store();
    setActiveStore(store);
    Post.put([post('1'), post('2')]);
    const seen: Array<readonly (Post | undefined)[]> = [];
    function Rows() {
      seen.push(useEntities(Post, ['2', '1', 'missing']));
      return null;
    }
    render(
      <DataProvider store={store}>
        <Rows />
      </DataProvider>,
    );
    const first = seen[seen.length - 1];
    expect(first?.map((p) => p?.id)).toEqual(['2', '1', undefined]);
    update(() => Post.merge('3', { text: 'not held' }));
    expect(seen[seen.length - 1]).toBe(first);
    update(() => User.merge('u-1', { name: 'Renamed' }));
    expect(seen[seen.length - 1]?.[1]?.user.name).toBe('Renamed');
    update(() => Post.put(post('missing')));
    expect(seen[seen.length - 1]?.[2]?.id).toBe('missing');
  });
});
