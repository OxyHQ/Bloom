import type { NODE_MODIFIERS } from '../generated/spec.generated';
import type {
  AlertView,
  ConnectionStatusView,
  DialogView,
  PopoverView,
} from '../controls/overlays';

describe('overlays and feedback', () => {
  it('each node type exposes exactly the modifiers the spec gives its kind', () => {
    type MethodsOf<T> = {
      [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
    }[keyof T];
    type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    type Of<K extends keyof typeof NODE_MODIFIERS> = (typeof NODE_MODIFIERS)[K][number];
    // A type error here means a node interface and spec/language.json disagree.
    const checks: [
      Same<MethodsOf<AlertView>, Of<'alert'>>,
      Same<MethodsOf<DialogView>, Of<'dialog'>>,
      Same<MethodsOf<PopoverView>, Of<'popover'>>,
      Same<MethodsOf<ConnectionStatusView>, Of<'connectionStatus'>>,
    ] = [true, true, true, true];
    expect(checks).toEqual([true, true, true, true]);
  });
});
