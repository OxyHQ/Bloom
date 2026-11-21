import {
  Notification as BloomNotification,
  type NotificationAction,
  type NotificationAvatar,
} from '@oxy.so/bloom/notification';

import type { ENUMS } from '../generated/spec.generated';
import { Node, type Child, type IconComponent, type ViewModifiers } from '../node';
import type { ControlDraw, ControlRenderer } from './draw';

/** The notification card: a status disc or an avatar, the message, actions and dismiss (Bloom `notification`). */
export type NotificationKind = 'notification';

/** The colour of its leading disc. */
export type NotificationStatus = (typeof ENUMS.notificationStatus)[number];
/** How urgently a screen reader announces it: `alert` (an error's default) or `status`. */
export type LiveRole = (typeof ENUMS.liveRole)[number];

/** Wording of your own (Bloom speaks it in the locale). */
export interface NotificationLabels {
  /** The close button's name. */
  readonly close?: string;
}

/** Bloom `Notification`: the one notification card. */
export interface NotificationView extends ViewModifiers<NotificationView> {
  description(value: string): NotificationView;
  /** Muted text after the title (`2m ago`). */
  timestamp(value: string): NotificationView;
  /** The leading disc's colour, and its glyph unless `.icon()` (`neutral` by default). */
  status(value: NotificationStatus): NotificationView;
  icon(value: IconComponent): NotificationView;
  /** An avatar in place of the disc (Bloom's avatar, with its presence). */
  avatar(value: NotificationAvatar): NotificationView;
  /** Small buttons under the message. */
  buttons(value: readonly NotificationAction[]): NotificationView;
  /** Whether it shows its close button (it does by default). */
  dismissible(value: boolean): NotificationView;
  /** What dismissing it does, once its exit has played. */
  onDismiss(value: () => void): NotificationView;
  /** It dismisses itself after this many ms, a countdown bar along its foot. */
  autoDismiss(value: number): NotificationView;
  /** It plays its entrance, after this many seconds. */
  introDelay(value: number): NotificationView;
  liveRole(value: LiveRole): NotificationView;
  labels(value: NotificationLabels): NotificationView;
}

/** Bloom `Notification`: its title, a string or a view. */
export function Notification(title: string | Child): NotificationView {
  return new Node('notification', { title }, []);
}

const text = (d: ControlDraw, value: string | Child) =>
  typeof value === 'string' ? value : d.render(value);

export const NOTIFICATIONS: Record<NotificationKind, ControlRenderer> = {
  notification: (d) => {
    const props = d.props();
    const buttons = d.own('buttons')?.value;
    Object.assign(props, {
      title: text(d, (d.node.props as { title: string | Child }).title),
      description: d.own('description')?.value,
      timestamp: d.own('timestamp')?.value,
      status: d.own('status')?.value,
      icon: d.own('icon')?.value,
      avatar: d.own('avatar')?.value,
      actions: buttons === undefined ? undefined : [...buttons],
      dismissible: d.own('dismissible')?.value,
      onDismiss: d.own('onDismiss')?.value,
      autoDismissDuration: d.own('autoDismiss')?.value,
      introDelay: d.own('introDelay')?.value,
      role: d.own('liveRole')?.value,
      closeLabel: (d.own('labels')?.value as NotificationLabels | undefined)?.close,
      testID: d.testID,
    });
    return d.component(BloomNotification, props);
  },
};
