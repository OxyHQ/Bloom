import { memo, useMemo, useState } from 'react';
import { DataProvider, setActiveStore, Store, useEntity } from '../index';
import { type Post as PostRecord, Post, post, User } from './fixtures';
import { render, update } from './support/render';

let store: Store;
beforeEach(() => {
  store = new Store();
  setActiveStore(store);
});

function counter() {
  const counts: Record<string, number> = {};
  return {
    counts,
    hit: (name: string) => {
      counts[name] = (counts[name] ?? 0) + 1;
    },
  };
}

describe('useEntity', () => {
  it('re-renders only the views that read a changed field', () => {
    Post.put(post('1'));
    const { counts, hit } = counter();
    function Likes() {
      hit('likes');
      return <>{useEntity(Post, '1')?.engagement.likes}</>;
    }
    function Text() {
      hit('text');
      return <>{useEntity(Post, '1')?.text}</>;
    }
    const tree = render(
      <DataProvider store={store}>
        <Likes />
        <Text />
      </DataProvider>,
    );
    update(() => Post.merge('1', { engagement: { likes: 1 } }));
    expect(counts).toEqual({ likes: 2, text: 1 });
    expect(tree.toJSON()).toEqual(['1', 'post 1']);
    // A sibling field of a read one is not read.
    update(() => Post.merge('1', { engagement: { boosts: 3 } }));
    expect(counts).toEqual({ likes: 2, text: 1 });
  });

  it('keeps a nested object identity for a memo child until a field it read changes', () => {
    Post.put(post('1'));
    const { counts, hit } = counter();
    const Engagement = memo(function Engagement({
      engagement,
    }: {
      engagement: PostRecord['engagement'];
    }) {
      hit('engagement');
      return <>{engagement.likes}</>;
    });
    function Row() {
      hit('row');
      const p = useEntity(Post, '1');
      return p ? (
        <>
          {p.viewerState.isLiked ? 'liked' : 'not'}
          <Engagement engagement={p.engagement} />
        </>
      ) : null;
    }
    render(<Row />);
    update(() => Post.merge('1', { viewerState: { isLiked: true } }));
    expect(counts).toEqual({ row: 2, engagement: 1 });
    update(() => Post.merge('1', { engagement: { likes: 4 } }));
    expect(counts).toEqual({ row: 3, engagement: 2 });
  });

  it('reads the current value of a field read for the first time', () => {
    Post.put(post('1'));
    let reveal: (value: boolean) => void = () => undefined;
    function Row() {
      const [shown, setShown] = useState(false);
      reveal = setShown;
      const p = useEntity(Post, '1');
      return <>{shown ? p?.text : 'hidden'}</>;
    }
    const tree = render(<Row />);
    update(() => Post.merge('1', { text: 'changed while unread' }));
    update(() => reveal(true));
    expect(tree.toJSON()).toBe('changed while unread');
  });

  it('follows refs into the records they name', () => {
    Post.put(post('1', { quotedPost: post('q') }));
    const { counts, hit } = counter();
    function Row() {
      hit('row');
      return <>{useEntity(Post, '1')?.quotedPost?.user.name}</>;
    }
    const tree = render(<Row />);
    update(() => User.merge('u-q', { name: 'Renamed' }));
    expect(tree.toJSON()).toBe('Renamed');
    update(() => Post.merge('q', { engagement: { likes: 9 } }));
    expect(counts.row).toBe(2);
  });

  it('renders a record that arrives later and one that is removed', () => {
    function Row() {
      return <>{useEntity(Post, '1')?.text ?? 'none'}</>;
    }
    const tree = render(<Row />);
    update(() => Post.put(post('1')));
    expect(tree.toJSON()).toBe('post 1');
    update(() => Post.remove('1'));
    expect(tree.toJSON()).toBe('none');
  });

  it('gives memoised code a new value exactly when what it read changed', () => {
    Post.put(post('1'));
    const { counts, hit } = counter();
    function Row() {
      const p = useEntity(Post, '1');
      const label = useMemo(() => {
        hit('memo');
        return `${p?.engagement.likes}`;
      }, [p]);
      return <>{label}</>;
    }
    const tree = render(<Row />);
    update(() => Post.merge('1', { text: 'unread' }));
    expect(counts.memo).toBe(1);
    update(() => Post.merge('1', { engagement: { likes: 2 } }));
    expect(counts.memo).toBe(2);
    expect(tree.toJSON()).toBe('2');
  });

  it('supports spread, keys and JSON, and refuses writes', () => {
    Post.put(post('1'));
    let seen: PostRecord | undefined;
    function Row() {
      seen = useEntity(Post, '1');
      return null;
    }
    render(<Row />);
    const p = seen as PostRecord;
    expect({ ...p.engagement }).toEqual({ likes: 0, boosts: 0 });
    expect(Object.keys(p)).toEqual(Object.keys(post('1')));
    expect(JSON.parse(JSON.stringify(p))).toEqual(post('1'));
    expect(() => {
      (p as { text: string }).text = 'x';
    }).toThrow(TypeError);
  });

  it('with a selector, re-renders when the selected value changes', () => {
    Post.put(post('1'));
    const { counts, hit } = counter();
    function Row() {
      hit('row');
      const liked = useEntity(Post, '1', (p) => p?.viewerState.isLiked ?? false);
      return <>{liked ? 'yes' : 'no'}</>;
    }
    const tree = render(<Row />);
    update(() => Post.merge('1', { text: 'other' }));
    expect(counts.row).toBe(1);
    update(() => Post.merge('1', { viewerState: { isLiked: true } }));
    expect(tree.toJSON()).toBe('yes');
    expect(counts.row).toBe(2);
  });

  it('reads the new store after an account switch', () => {
    Post.put(post('1', { text: 'account A' }));
    const other = new Store();
    other.put(Post.definition, post('1', { text: 'account B' }) as never);
    function Row() {
      return <>{useEntity(Post, '1')?.text}</>;
    }
    const tree = render(
      <DataProvider store={store}>
        <Row />
      </DataProvider>,
    );
    expect(tree.toJSON()).toBe('account A');
    update(() =>
      tree.update(
        <DataProvider store={other}>
          <Row />
        </DataProvider>,
      ),
    );
    expect(tree.toJSON()).toBe('account B');
  });
});
