export type { ConnectionStatusToastsProps } from './shared';
// The hatch a consumer needs off Metro, where the optional `require` does not
// deliver the peer even when it is installed. See `netinfo.ts`.
export { provideNetInfo, type NetInfoLike } from './netinfo';
export {
  ConnectionStatusToasts,
} from './ConnectionStatusToasts.web';
