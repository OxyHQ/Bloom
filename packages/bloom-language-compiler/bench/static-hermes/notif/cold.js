// Cold start: the process loads the bundle, evaluates React and the module, and commits the first tree.
import { createElement } from 'react';
import TestRenderer from 'react-test-renderer';
import { NotificationSettingsScreen } from './module';
const root = TestRenderer.create(createElement(NotificationSettingsScreen), {
  unstable_isConcurrent: false,
});
root._Scheduler.unstable_flushAll();
print(root.root.findAll((n) => n.type === 'RCTSwitch').length);
