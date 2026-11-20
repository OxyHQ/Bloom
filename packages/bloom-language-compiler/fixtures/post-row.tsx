import { HStack, Text, VStack } from '@oxy.so/bloom-language';

type Post = { author: { name: string }; text: string; pinned: boolean };

export function PostRow({ post, gap }: { post: Post; gap: 'sm' | 'md' }) {
  return HStack(
    VStack(
      Text(post.author.name).font('body').weight('semibold'),
      Text(post.text).font('body'),
      post.pinned && Text('Pinned').font('caption').foreground('primary'),
    ).spacing('xs'),
  )
    .padding('md')
    .spacing(gap);
}
