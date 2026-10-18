import { render } from '@testing-library/react-native';
import { DialogFrameProvider, useDialogFrameScrollReset } from '../dialog/DialogFrameContent';

function Scroller({ enabled, reset }: { enabled: boolean; reset: () => void }) {
  useDialogFrameScrollReset(enabled, reset);
  return null;
}

it('resets once per screen change, never first mount, same-key rerenders, or callback changes', () => {
  const reset = jest.fn();
  const draw = (frameKey?: string) => (
    <DialogFrameProvider frameKey={frameKey}>
      <Scroller enabled reset={() => reset()} />
    </DialogFrameProvider>
  );
  const result = render(draw('first'));
  expect(reset).not.toHaveBeenCalled();
  result.rerender(draw('first'));
  expect(reset).not.toHaveBeenCalled();
  result.rerender(draw('second'));
  expect(reset).toHaveBeenCalledTimes(1);
  result.rerender(draw('second'));
  expect(reset).toHaveBeenCalledTimes(1);
  result.rerender(draw(undefined));
  result.rerender(draw('third'));
  expect(reset).toHaveBeenCalledTimes(1);
});

it('leaves a caller-owned scroller untouched and does not replay skipped transitions', () => {
  const reset = jest.fn();
  const draw = (frameKey: string, enabled: boolean) => (
    <DialogFrameProvider frameKey={frameKey}>
      <Scroller enabled={enabled} reset={reset} />
    </DialogFrameProvider>
  );
  const result = render(draw('first', false));
  result.rerender(draw('second', false));
  result.rerender(draw('second', true));
  expect(reset).not.toHaveBeenCalled();
  result.rerender(draw('third', true));
  expect(reset).toHaveBeenCalledTimes(1);
});
