import { createHash } from 'node:crypto';
import { render } from '@testing-library/react-native';
import { Path } from 'react-native-svg';
import type { BloomIconComponent } from '../icons/icon-component';
import { MediaAttachmentIcon } from '../icons/social/MediaAttachmentIcon';
import { GifAttachmentIcon } from '../icons/social/GifAttachmentIcon';
import { ReplyIcon } from '../icons/social/ReplyIcon';
import { RepostIcon } from '../icons/social/RepostIcon';
import { LikeIcon } from '../icons/social/LikeIcon';
import { LikeFillIcon } from '../icons/social/LikeFillIcon';
import { BookmarkIcon } from '../icons/social/BookmarkIcon';
import { BookmarkFillIcon } from '../icons/social/BookmarkFillIcon';
import { ShareIcon } from '../icons/social/ShareIcon';

// Exercise the shared SVG renderer, with only the theme environment fixed.
jest.mock('../theme/use-theme', () => ({
  useTheme: () => ({ colors: { primary: '#345678' } }),
}));

// Approved path fingerprints protect the authored shapes independently of their
// paint, host size and shared renderer. Outline hearts/replies use an 18-unit
// canvas; normalizing those paths to 24 would visibly shrink them.
const glyphs = [
  {
    name: 'MediaAttachmentIcon',
    Icon: MediaAttachmentIcon,
    viewBox: '0 0 24 24',
    strokeWidth: 0,
    fingerprint: '4845e189fde8b9759f29194ff000caf034a0327043d060063901ba19eb9abc08',
  },
  {
    name: 'GifAttachmentIcon',
    Icon: GifAttachmentIcon,
    viewBox: '0 0 24 24',
    strokeWidth: 0,
    fingerprint: 'ed703dc5477afa0eba52501c8135a05c7b09aa51ef4ebbd2f015775fd63bc9e5',
  },
  {
    name: 'ReplyIcon',
    Icon: ReplyIcon,
    viewBox: '0 0 18 18',
    strokeWidth: 1.5,
    fingerprint: '67f6309c4c75c0cf1a619b8f4488332df4f47cd8c755de8f6e7bdbe86f2b34ad',
  },
  {
    name: 'RepostIcon',
    Icon: RepostIcon,
    viewBox: '0 0 24 24',
    strokeWidth: 0,
    fingerprint: '1f656bf859d799c4696ee6becf565b6fbe53f11de4b8b83a5522bb663db565c2',
  },
  {
    name: 'LikeIcon',
    Icon: LikeIcon,
    viewBox: '0 0 18 18',
    strokeWidth: 1.8,
    fingerprint: '1217f8404fe9a57b6c7c6095771c3eeba032001b876c6f59344b680b51cae8ee',
  },
  {
    name: 'LikeFillIcon',
    Icon: LikeFillIcon,
    viewBox: '0 0 18 18',
    strokeWidth: 0,
    fingerprint: 'aa0023c115009be961ef2454f707701def72b4e4c32dacf7c9db2262b3754314',
  },
  {
    name: 'BookmarkIcon',
    Icon: BookmarkIcon,
    viewBox: '0 0 24 24',
    strokeWidth: 0,
    fingerprint: 'cd77b9764a57a92f2296e408a5c8c2c52b54345f74d0f19a65b2b08a54531517',
  },
  {
    name: 'BookmarkFillIcon',
    Icon: BookmarkFillIcon,
    viewBox: '0 0 24 24',
    strokeWidth: 0,
    fingerprint: '842d064b1df558336ca7e2088510f09c6b4be2a926449388d81e9e402d8f9f4f',
  },
  {
    name: 'ShareIcon',
    Icon: ShareIcon,
    viewBox: '0 0 24 24',
    strokeWidth: 0,
    fingerprint: '43c945a114091404523d8950a801ae728a9ae6f60b861e82141b882f45786546',
  },
] satisfies Array<{
  name: string;
  Icon: BloomIconComponent;
  viewBox: string;
  strokeWidth: number;
  fingerprint: string;
}>;

describe('social glyphs', () => {
  it.each(glyphs)(
    'preserves $name while following the control paint and size',
    ({ Icon, viewBox, strokeWidth, fingerprint }) => {
      const screen = render(<Icon width={28} height={28} fill="#abcdef" />);
      const path = screen.UNSAFE_getByType(Path);
      const svg = screen.toJSON();
      if (!svg || Array.isArray(svg)) throw new Error('Expected one SVG host');
      expect(svg.props).toMatchObject({ width: 28, height: 28, viewBox });
      expect(createHash('sha256').update(path.props.d).digest('hex')).toBe(fingerprint);
      expect(path.props).toMatchObject({
        fill: strokeWidth ? 'none' : '#abcdef',
        stroke: strokeWidth ? '#abcdef' : 'none',
        strokeWidth,
      });
      screen.rerender(<Icon width={20} height={20} fill="#fedcba" />);
      expect(screen.UNSAFE_getByType(Path).props).toMatchObject({
        fill: strokeWidth ? 'none' : '#fedcba',
        stroke: strokeWidth ? '#fedcba' : 'none',
      });
    },
  );
});
