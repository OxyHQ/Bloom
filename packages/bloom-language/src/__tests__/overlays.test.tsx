import { act } from 'react-test-renderer';

import { Alert, ConnectionStatus, Dialog, Popover } from '../controls/overlays';
import { Button, Text, VStack } from '../primitives';
import { toElement } from '../render';
import { toast } from '../toast';
import { toastCalls } from './support/bloom-overlays';
import { mount, only, quietRenderer } from './support/mount';

quietRenderer();

/** The Button stand-in's host. */
const BUTTON: string = 'BloomButton';

describe('presentations', () => {
  it('an alert is AlertDialog beside its view, open and closed through the binding', () => {
    const set = jest.fn();
    const remove = jest.fn();
    const renderer = mount(
      toElement(
        Button(Text('Delete')).alert(
          [true, set],
          Alert('Delete post?')
            .message('It cannot be undone.')
            .confirmLabel('Delete')
            .onConfirm(remove)
            .destructive()
            .testID('confirm'),
        ),
      ),
    );
    const json = renderer.toJSON() as { type: string }[];
    expect(json.map((node) => node.type)).toEqual(['BloomButton', 'AlertDialog']);
    const alert = only(renderer, 'AlertDialog');
    expect(alert.props).toMatchObject({
      open: true,
      title: 'Delete post?',
      description: 'It cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: remove,
      destructive: true,
      testID: 'confirm',
    });
    act(() => alert.props.onOpenChange(false));
    expect(set).toHaveBeenCalledWith(false);
  });

  it('a dialog draws its content, and its dismissal sets the binding false', () => {
    const set = jest.fn();
    const renderer = mount(
      toElement(
        VStack(Text('Body')).dialog(
          [true, set],
          Dialog(Text('Inside'))
            .title('Edit')
            .message('Change it.')
            .presentAt('bottom', 'center')
            .buttons([{ label: 'Save' }])
            .dismissOnBackdrop(false),
        ),
      ),
    );
    const dialog = only(renderer, 'Dialog');
    expect(dialog.props).toMatchObject({
      open: true,
      title: 'Edit',
      description: 'Change it.',
      placement: { base: 'bottom', md: 'center' },
      actions: [{ label: 'Save' }],
      dismissOnBackdrop: false,
    });
    expect(
      JSON.stringify(dialog.children.map((child) => (child as { props: unknown }).props)),
    ).toContain('Inside');
    act(() => dialog.props.onClose());
    expect(set).toHaveBeenCalledWith(false);
  });

  it('one placement is the placement itself', () => {
    const renderer = mount(
      toElement(VStack().dialog([false, () => {}], Dialog().presentAt('center'))),
    );
    expect(only(renderer, 'Dialog').props.placement).toBe('center');
  });

  it('a popover takes its view as the trigger', () => {
    const set = jest.fn();
    const renderer = mount(
      toElement(
        Button(Text('Info')).popover(
          [false, set],
          Popover(Text('Details')).label('Details').side('bottom', 'end'),
        ),
      ),
    );
    const popover = only(renderer, 'Popover');
    expect(popover.props).toMatchObject({ open: false, onOpenChange: set });
    const trigger = only(renderer, 'PopoverTrigger');
    expect(trigger.props.asChild).toBe(true);
    expect(trigger.findAll((node) => node.type === BUTTON)).toHaveLength(1);
    expect(only(renderer, 'PopoverContent').props).toMatchObject({
      label: 'Details',
      side: 'bottom',
      align: 'end',
    });
  });
});

describe('feedback', () => {
  it('ConnectionStatus is Bloom’s connection toasts', () => {
    const renderer = mount(toElement(ConnectionStatus()));
    expect(only(renderer, 'ConnectionStatusToasts').props).toEqual({});
  });

  it('toast hands Bloom a title as it is, and a view as its element', () => {
    toastCalls.length = 0;
    toast('Saved');
    toast.success('Done', { duration: 1000 });
    toast.error(Text('Failed'));
    expect(toastCalls[0]).toEqual(['toast', 'Saved', undefined]);
    expect(toastCalls[1]).toEqual(['success', 'Done', { duration: 1000 }]);
    const [method, element] = toastCalls[2] as [string, { type: unknown }];
    expect(method).toBe('error');
    expect(typeof element.type).toBe('function');
  });
});
