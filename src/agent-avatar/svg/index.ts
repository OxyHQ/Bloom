/**
 * A character as an SVG document, with no React and no native module, for a server
 * (`./portrait-svg`). Apps keep drawing with `AgentAvatar`; this entry is for code that cannot
 * render React. See docs/agent-avatar.mdx.
 */
export {
  avatarPictureBackground,
  renderAgentAvatarPicture,
  renderAgentAvatarSvg,
  vectorFrameToSvg,
} from '../portrait-svg';
export type { AgentAvatarSvgOptions } from '../portrait-svg';
export { avatarCharacterInColor, parseAvatarCharacter } from '../character';
export type { AvatarCharacter } from '../character';
