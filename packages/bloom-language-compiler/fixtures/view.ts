import { HStack, Text, VStack, view } from '@oxy.so/bloom-language';

type Post = { author: { name: string }; text: string };

export const PostRow = view((post: Post) =>
  HStack(
    VStack(
      Text(post.author.name).font('body').weight('semibold'),
      Text(post.text).font('body'),
    ).spacing('xs'),
  ).padding('md'),
);

export function label(text: string) {
  return Text(text).font('caption');
}
