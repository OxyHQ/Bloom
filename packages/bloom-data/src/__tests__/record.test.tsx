import {
  DataProvider,
  entity,
  type RecordView,
  setActiveStore,
  skip,
  source,
  Store,
  useRecord,
} from '../index';
import { render, settle, update } from './support/render';

interface Person {
  id: string;
  username: string;
  bio?: string;
}

const Person = entity<Person>('record-test-person', {
  id: (p) => p.id,
  index: { username: (p) => p.username.toLowerCase() },
});

let store: Store;
beforeEach(() => {
  store = new Store();
  setActiveStore(store);
});
afterEach(() => store.close());

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function capture<T>() {
  const views: RecordView<T>[] = [];
  return { views, last: () => views[views.length - 1] as RecordView<T> };
}

describe('a record source keyed by an index', () => {
  it('shows a record already held under the value at once, then reads it again', async () => {
    Person.put({ id: 'p1', username: 'Ada' });
    const answer = deferred<Person>();
    const byUsername = source(Person, {
      key: (username: string) => username.toLowerCase(),
      index: 'username',
      load: () => answer.promise,
    });
    const seen = capture<Person>();
    function Profile() {
      seen.views.push(useRecord(byUsername, 'ada'));
      return null;
    }
    render(
      <DataProvider store={store}>
        <Profile />
      </DataProvider>,
    );
    expect(seen.last().value?.id).toBe('p1');
    expect(seen.last().isLoading).toBe(false);
    await settle(() => answer.resolve({ id: 'p1', username: 'Ada', bio: 'Mathematician' }));
    expect(seen.last().value?.bio).toBe('Mathematician');
  });

  it('follows the index when a record takes or leaves the value', async () => {
    const byUsername = source(Person, {
      key: (username: string) => username,
      index: 'username',
      load: async () => null,
      stale: Number.POSITIVE_INFINITY,
    });
    const seen = capture<Person>();
    function Profile() {
      seen.views.push(useRecord(byUsername, 'grace'));
      return null;
    }
    render(
      <DataProvider store={store}>
        <Profile />
      </DataProvider>,
    );
    await settle();
    expect(seen.last().value).toBeUndefined();
    update(() => Person.put({ id: 'p2', username: 'Grace' }));
    expect(seen.last().value?.id).toBe('p2');
    update(() => Person.merge('p2', { username: 'Hopper' }));
    expect(seen.last().value).toBeUndefined();
    expect(Person.lookup('username', 'hopper')).toBe('p2');
  });

  it('removes the record the value names when the server says it is gone', async () => {
    Person.put({ id: 'p3', username: 'linus' });
    const byUsername = source(Person, {
      key: (username: string) => username,
      index: 'username',
      load: async () => null,
    });
    await byUsername.fetch('linus');
    expect(Person.has('p3')).toBe(false);
    expect(Person.lookup('username', 'linus')).toBeUndefined();
  });
});

describe('useRecord with skip', () => {
  it('observes and reads nothing until its arguments are known', async () => {
    const load = jest.fn(async (_request: unknown, id: string) => ({ id, username: id }));
    const byId = source(Person, { key: (id: string) => id, load });
    const seen = capture<Person>();
    function Profile({ id }: { id: string | null }) {
      seen.views.push(useRecord(byId, ...(id === null ? [skip] : [id])));
      return null;
    }
    const tree = render(
      <DataProvider store={store}>
        <Profile id={null} />
      </DataProvider>,
    );
    await settle();
    expect(load).not.toHaveBeenCalled();
    expect(seen.last()).toMatchObject({ status: 'idle', isLoading: false, value: undefined });
    await settle(() =>
      tree.update(
        <DataProvider store={store}>
          <Profile id="p4" />
        </DataProvider>,
      ),
    );
    expect(load).toHaveBeenCalledTimes(1);
    expect(seen.last().value?.username).toBe('p4');
  });
});
