/**
 * NATIVE variant: the optional `@react-native-community/netinfo` peer, loaded
 * through `./netinfo`. Without it the status stays unknown (online, unmetered)
 * rather than breaking the bundle. The web fork reads the browser instead.
 */
import {
  createNetworkStatusStore,
  type NetworkStatus,
  type UseNetworkStatusOptions,
  useNetworkStatusFrom,
} from './network-status';
import { loadNetInfo } from './netinfo';

const store = createNetworkStatusStore((publish) => {
  const netInfo = loadNetInfo();
  if (!netInfo) return undefined;
  // `isInternetReachable` is null until the first probe resolves; that counts as
  // connected, so a captive-portal check never flashes an outage on launch.
  return netInfo.addEventListener((state) =>
    publish({
      online: Boolean(state.isConnected && state.isInternetReachable !== false),
      metered: state.type === 'cellular' || state.details?.isConnectionExpensive === true,
    }),
  );
});

/**
 * Whether the device is online, and whether its connection is metered — live,
 * from one subscription shared by every caller. Before the platform answers, and
 * without netinfo installed, it reads `{ online: true, metered: false }`.
 */
export function useNetworkStatus(options?: UseNetworkStatusOptions): NetworkStatus {
  return useNetworkStatusFrom(store, options);
}
