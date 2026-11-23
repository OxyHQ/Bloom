import { action, entity, setActiveStore, Store } from '../index';
import { Feed, Post, post, User } from './fixtures';

let store: Store;
beforeEach(() => {
  store = new Store();
  setActiveStore(store);
});

describe('entity', () => {
  it('stores records by id and reads them back with refs resolved', () => {
    Post.put(post('1'));
    expect(Post.get('1')).toEqual(post('1'));
    expect(User.get('u-1')).toEqual({ id: 'u-1', name: 'User 1' });
  });

  it('keeps one copy of a referenced record', () => {
    Post.put([
      post('1', { user: { id: 'u', name: 'Ada' } }),
      post('2', { user: { id: 'u', name: 'Ada' } }),
    ]);
    User.merge('u', { name: 'Ada L.' });
    expect(Post.get('1')?.user.name).toBe('Ada L.');
    expect(Post.get('2')?.user.name).toBe('Ada L.');
  });

  it('normalises a ref two keys deep and a ref to its own entity', () => {
    Post.put(post('boost', { boost: { originalPost: post('orig') }, quotedPost: post('q') }));
    expect(Post.has('orig')).toBe(true);
    expect(Post.has('q')).toBe(true);
    Post.merge('orig', { engagement: { likes: 5 } });
    expect(Post.get('boost')?.boost?.originalPost?.engagement.likes).toBe(5);
    expect(Post.referencing(Post, 'orig')).toEqual(['boost']);
  });

  it('returns the same read until a dependency changes', () => {
    Post.put(post('1'));
    const first = Post.get('1');
    expect(Post.get('1')).toBe(first);
    User.merge('u-1', { name: 'changed' });
    expect(Post.get('1')).not.toBe(first);
  });

  it('keeps viewer fields when an anonymous payload replaces a record', () => {
    Post.put(post('1', { viewerState: { isLiked: true, isSaved: true } }));
    Post.put(post('1', { text: 'edited' }), { anonymous: true });
    expect(Post.get('1')?.text).toBe('edited');
    expect(Post.get('1')?.viewerState).toEqual({ isLiked: true, isSaved: true });
  });

  it('patches from the current record and updates by replacement', () => {
    Post.put(post('1'));
    Post.patch('1', (p) => ({ engagement: { likes: p.engagement.likes + 1 } }));
    expect(Post.get('1')?.engagement).toEqual({ likes: 1, boosts: 0 });
    Post.update('1', (p) => ({ ...p, text: 'new' }));
    expect(Post.get('1')?.text).toBe('new');
    expect(Post.merge('missing', { text: 'x' })).toBe(false);
  });

  it('removes a record from every list of its entity, including the extra', () => {
    Post.put([post('1'), post('2')]);
    Feed.set('home', () => ({
      ids: ['1', '2'],
      extra: { cards: ['1', '2'] },
      next: undefined,
      hasMore: false,
      visited: [],
      updatedAt: 0,
      origin: 'local',
    }));
    Post.remove('1');
    expect(Post.get('1')).toBeUndefined();
    expect(Feed.get('home')?.ids).toEqual(['2']);
    expect(Feed.get('home')?.extra).toEqual({ cards: ['2'] });
  });

  it('prepends only ids not already in a list', () => {
    Feed.set('home', () => ({
      ids: ['2'],
      extra: undefined,
      next: undefined,
      hasMore: false,
      visited: [],
      updatedAt: 0,
      origin: 'local',
    }));
    Feed.prepend('home', ['1', '2']);
    expect(Feed.get('home')?.ids).toEqual(['1', '2']);
  });

  it('ignores writes to a closed store', async () => {
    await store.close();
    Post.put(post('1'));
    expect(store.read(Post.definition, '1')).toBeUndefined();
  });

  it('collects records nothing holds, never those in a list or listened to', () => {
    Post.put([post('kept'), post('dropped'), post('listened')]);
    Feed.set('home', () => ({
      ids: ['kept'],
      extra: undefined,
      next: undefined,
      hasMore: false,
      visited: [],
      updatedAt: 0,
      origin: 'local',
    }));
    store.listen(store.slot(Post.definition, 'listened', true), () => undefined);
    store.collect(0);
    expect(Post.has('kept')).toBe(true);
    expect(User.has('u-kept')).toBe(true);
    expect(Post.has('listened')).toBe(true);
    expect(Post.has('dropped')).toBe(false);
  });
});

describe('combine', () => {
  interface Person {
    id: string;
    name?: string;
    bio?: string;
  }
  const Person = entity<Person>('test-combined-person', {
    id: (p) => p.id,
    // A sparse payload keeps what it does not carry; a degraded one is refused.
    combine: (incoming, held) =>
      incoming.name === 'Unknown' ? held : { ...held, ...incoming, bio: incoming.bio ?? held.bio },
  });
  const Card = entity<{ id: string; person: Person }>('test-combined-card', {
    id: (c) => c.id,
    refs: { person: Person },
  });

  it('merges a sparse record into the held one', () => {
    Person.put({ id: 'p', name: 'Ada', bio: 'Mathematician' });
    Person.put({ id: 'p', name: 'Ada L.' });
    expect(Person.get('p')).toEqual({ id: 'p', name: 'Ada L.', bio: 'Mathematician' });
  });

  it('refuses a record by returning the held one, and wakes nobody', () => {
    Person.put({ id: 'p', name: 'Ada' });
    const before = Person.get('p');
    const clock = store.clock;
    Person.put({ id: 'p', name: 'Unknown' });
    expect(Person.get('p')).toBe(before);
    expect(store.clock).toBe(clock);
  });

  it('combines a record embedded through a ref', () => {
    Person.put({ id: 'p', name: 'Ada', bio: 'Mathematician' });
    Card.put({ id: 'c', person: { id: 'p', name: 'Unknown' } });
    expect(Card.get('c')?.person).toEqual({ id: 'p', name: 'Ada', bio: 'Mathematician' });
    Card.put({ id: 'c', person: { id: 'p', name: 'Ada L.' } });
    expect(Person.get('p')?.bio).toBe('Mathematician');
  });

  it('combines with the server copy, never with an optimistic layer', async () => {
    Person.put({ id: 'p', name: 'Ada', bio: 'Mathematician' });
    let reject: (error: Error) => void = () => undefined;
    const rename = action({
      optimistic: () => Person.merge('p', { bio: 'pending' }),
      run: () => new Promise<void>((_, fail) => (reject = fail)),
    });
    const call = rename();
    expect(Person.get('p')?.bio).toBe('pending');
    Person.put({ id: 'p', name: 'Ada L.' });
    reject(new Error('refused'));
    await call.catch(() => undefined);
    expect(Person.get('p')).toEqual({ id: 'p', name: 'Ada L.', bio: 'Mathematician' });
  });
});
