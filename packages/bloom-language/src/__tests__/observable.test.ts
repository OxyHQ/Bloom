import { Observable } from '../observable';

class Feed extends Observable {
  posts: readonly string[] = [];
  filter = '';
}

describe('Observable', () => {
  it('notifies the readers of the field written, and only them', () => {
    const feed = new Feed();
    const posts = jest.fn();
    const filter = jest.fn();
    feed.$subscribe(['posts'], posts);
    feed.$subscribe(['filter'], filter);
    feed.$set('posts', ['a']);
    expect(posts).toHaveBeenCalledTimes(1);
    expect(filter).not.toHaveBeenCalled();
    expect(feed.posts).toEqual(['a']);
  });

  it('changes the version of the fields written, and skips a write of the same value', () => {
    const feed = new Feed();
    const before = feed.$version(['posts', 'filter']);
    feed.$set('filter', '');
    expect(feed.$version(['posts', 'filter'])).toBe(before);
    feed.$set('filter', 'x');
    expect(feed.$version(['posts', 'filter'])).toBe(before + 1);
    expect(feed.$version(['posts'])).toBe(0);
  });

  it('stops notifying once unsubscribed', () => {
    const feed = new Feed();
    const listener = jest.fn();
    const unsubscribe = feed.$subscribe(['posts'], listener);
    unsubscribe();
    feed.$set('posts', ['b']);
    expect(listener).not.toHaveBeenCalled();
  });
});
