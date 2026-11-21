import { Notification } from '@oxy.so/bloom/notification';
import { RiFolderLine } from '@oxy.so/bloom/icons';
import { Text } from '@oxy.so/bloom/typography';

import { ENUMS } from '../src/generated/spec.generated';
import * as L from '../src/index';
import { toElement } from '../src/render';
import type { ParityCase } from './support/cases';

const press = () => {};
const BUTTONS = [
  { label: 'Undo', onPress: press },
  { label: 'View', onPress: press },
];

export const NOTIFICATION_CASES: readonly ParityCase[] = [
  {
    name: 'a notification',
    language: () => toElement(L.Notification('Saved')),
    bloom: () => <Notification title="Saved" />,
  },
  ...ENUMS.notificationStatus.map((status) => ({
    name: `a ${status} notification`,
    language: () =>
      toElement(L.Notification('Upload finished').description('3 files').status(status)),
    bloom: () => <Notification title="Upload finished" description="3 files" status={status} />,
  })),
  {
    name: 'a notification with its icon, time, buttons and words, padded',
    language: () =>
      toElement(
        L.Notification('Deployed')
          .description('Build 412 is live')
          .timestamp('2m ago')
          .icon(RiFolderLine)
          .buttons(BUTTONS)
          .onDismiss(press)
          .labels({ close: 'Close' })
          .liveRole('alert')
          .padding('sm')
          .testID('deploy'),
      ),
    bloom: () => (
      <Notification
        title="Deployed"
        description="Build 412 is live"
        timestamp="2m ago"
        icon={RiFolderLine}
        actions={BUTTONS}
        onDismiss={press}
        closeLabel="Close"
        role="alert"
        style={{ paddingTop: 8, paddingBottom: 8, paddingStart: 8, paddingEnd: 8 }}
        testID="deploy"
      />
    ),
  },
  {
    name: 'a notification from a person, not dismissible',
    language: () =>
      toElement(
        L.Notification('Ana replied')
          .avatar({ name: 'Ana Ruiz', presence: 'online' })
          .dismissible(false),
      ),
    bloom: () => (
      <Notification
        title="Ana replied"
        avatar={{ name: 'Ana Ruiz', presence: 'online' }}
        dismissible={false}
      />
    ),
  },
  {
    name: 'a notification titled by a view',
    language: () => toElement(L.Notification(L.Text('Saved').font('body').weight('semibold'))),
    bloom: () => <Notification title={<Text variant="body-semibold">Saved</Text>} />,
  },
];

/**
 * A notification that dismisses itself draws its countdown as it runs: two
 * side by side (the story's pairs) are sampled at different moments of it.
 * Compared by the Jest suites, where time stands still, and left out of the story.
 */
export const NOTIFICATION_CASES_TIMED: readonly ParityCase[] = [
  {
    name: 'a notification that dismisses itself, after its entrance',
    language: () => toElement(L.Notification('Copied').autoDismiss(4000).introDelay(0.2)),
    bloom: () => <Notification title="Copied" autoDismissDuration={4000} introDelay={0.2} />,
  },
];
