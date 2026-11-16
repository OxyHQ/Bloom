import { List } from '../list/List.web';
import { createNotificationCenter } from './NotificationCenterBase';
export const NotificationCenter = createNotificationCenter({ List });
export { resolveNotificationCenterPalette } from './NotificationCenterBase';
