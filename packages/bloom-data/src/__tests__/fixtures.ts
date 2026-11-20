import { type Entity, entity, list } from '../index';

export interface User {
  id: string;
  name: string;
}

export interface Post {
  id: string;
  text: string;
  user: User;
  engagement: { likes: number; boosts: number; views?: number };
  viewerState: { isLiked: boolean; isSaved: boolean };
  quotedPost?: Post;
  boost?: { originalPost?: Post };
}

export const User = entity<User>('test-user', { id: (u) => u.id, persist: true });

// A self-referencing entity needs its type written out (TypeScript cannot infer it).
export const Post: Entity<Post> = entity<Post>('test-post', {
  id: (p) => p.id,
  refs: { user: User, quotedPost: () => Post, 'boost.originalPost': () => Post },
  viewerFields: ['viewerState'],
  persist: { version: 1 },
});

export const Feed = list<{ cards: string[] }>('test-feed', {
  of: Post,
  persist: true,
  dropFromExtra: (extra, ids) => ({ cards: extra.cards.filter((id) => !ids.has(id)) }),
});

export function post(id: string, overrides: Partial<Post> = {}): Post {
  return {
    id,
    text: `post ${id}`,
    user: { id: `u-${id}`, name: `User ${id}` },
    engagement: { likes: 0, boosts: 0 },
    viewerState: { isLiked: false, isSaved: false },
    ...overrides,
  };
}
