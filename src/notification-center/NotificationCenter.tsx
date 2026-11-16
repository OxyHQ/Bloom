import { List } from '../list/List';
import { createNotificationCenter } from './NotificationCenterBase';
export const NotificationCenter = createNotificationCenter({ List });
export { resolveNotificationCenterPalette } from './NotificationCenterBase';
