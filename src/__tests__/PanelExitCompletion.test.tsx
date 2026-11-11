/** @jest-environment jsdom */
import { act, renderHook } from '@testing-library/react-native';
import { usePanelExitCompletion } from '../app-shell/use-panel-exit-completion';

function setup({ present = true, floating = false, css = true, reducedMotion = false } = {}) {
  const node = document.createElement('div');
  node.dataset.bloomPanelOwner = 'group';
  const content = document.createElement('div');
  const material = document.createElement('div');
  material.dataset.bloomPanelMaterial = '';
  node.append(material);
  material.append(content);
  const owner = { current: node };
  const complete = jest.fn();
  let finish = () => {};
  const transition = {
    transitionProperty: 'opacity',
    playState: 'running',
    pending: false,
    effect: { target: content },
    finished: new Promise<void>((resolve) => {
      finish = resolve;
    }),
  };
  node.getAnimations = jest.fn(() => [transition as unknown as Animation]);
  const hook = renderHook(
    ({
      present,
      floating,
      reducedMotion,
      onExitComplete = complete,
    }: {
      present: boolean;
      floating: boolean;
      reducedMotion: boolean;
      onExitComplete?: () => void;
    }) =>
      usePanelExitCompletion({
        present,
        floating,
        reducedMotion,
        css,
        owner,
        onExitComplete,
      }),
    { initialProps: { present, floating, reducedMotion, onExitComplete: complete } },
  );
  const settle = async () => {
    transition.playState = 'finished';
    await act(async () => finish());
  };
  return { ...hook, complete, settle, node, content };
}

it('waits for owned paint completion and fires once', async () => {
  const tree = setup();
  tree.rerender({ present: false, floating: false, reducedMotion: false });
  expect(tree.complete).not.toHaveBeenCalled();
  await tree.settle();
  expect(tree.complete).toHaveBeenCalledTimes(1);
  await tree.settle();
  expect(tree.complete).toHaveBeenCalledTimes(1);
});
it('never reports an initially hidden panel, or an exit cancelled by reopening', async () => {
  const hidden = setup({ present: false });
  await hidden.settle();
  expect(hidden.complete).not.toHaveBeenCalled();
  const tree = setup();
  tree.rerender({ present: false, floating: false, reducedMotion: false });
  tree.rerender({ present: true, floating: false, reducedMotion: false });
  await tree.settle();
  expect(tree.complete).not.toHaveBeenCalled();
});
it('settles reduced-motion exits immediately but not floating sheets', () => {
  const tree = setup({ reducedMotion: true });
  tree.rerender({ present: false, floating: false, reducedMotion: true });
  expect(tree.complete).toHaveBeenCalledTimes(1);
  const sheet = setup({ floating: true, reducedMotion: true });
  sheet.rerender({ present: false, floating: true, reducedMotion: true });
  expect(sheet.complete).not.toHaveBeenCalled();
  act(() => sheet.result.current.completeFloating());
  expect(sheet.complete).toHaveBeenCalledTimes(1);
});
it('handles a sheet gesture closing before the controlled visibility commits', () => {
  const tree = setup({ floating: true });
  act(() => tree.result.current.completeFloating());
  expect(tree.complete).not.toHaveBeenCalled();
  tree.rerender({ present: false, floating: true, reducedMotion: false });
  expect(tree.complete).toHaveBeenCalledTimes(1);
});
it('migrates an open panel between inline and sheet without reporting an exit', () => {
  const tree = setup();
  tree.rerender({ present: true, floating: true, reducedMotion: false });
  tree.rerender({ present: true, floating: false, reducedMotion: false });
  expect(tree.complete).not.toHaveBeenCalled();
});
it('native completion is generation-bound and never fires after unmount', () => {
  const tree = setup({ css: false });
  tree.rerender({ present: false, floating: false, reducedMotion: false });
  const stale = tree.result.current.captureNativeCompletion();
  expect(tree.complete).not.toHaveBeenCalled();
  tree.rerender({ present: true, floating: false, reducedMotion: false });
  act(() => stale?.());
  expect(tree.complete).not.toHaveBeenCalled();
  tree.rerender({ present: false, floating: false, reducedMotion: false });
  const final = tree.result.current.captureNativeCompletion();
  tree.unmount();
  act(() => final?.());
  expect(tree.complete).not.toHaveBeenCalled();
});

it('captures the callback for the exit instead of retargeting a pending completion', async () => {
  const tree = setup();
  tree.rerender({ present: false, floating: false, reducedMotion: false });
  const replacement = jest.fn();
  tree.rerender({
    present: false,
    floating: false,
    reducedMotion: false,
    onExitComplete: replacement,
  });
  await tree.settle();
  expect(tree.complete).toHaveBeenCalledTimes(1);
  expect(replacement).not.toHaveBeenCalled();
});
it('ignores transitions belonging to arbitrary application content', () => {
  const tree = setup();
  const userContent = document.createElement('div');
  tree.content.append(userContent);
  tree.node.getAnimations = jest.fn(() => [
    {
      transitionProperty: 'opacity',
      playState: 'running',
      pending: false,
      effect: { target: userContent },
      finished: new Promise(() => {}),
    } as unknown as Animation,
  ]);
  tree.rerender({ present: false, floating: false, reducedMotion: false });
  expect(tree.complete).toHaveBeenCalledTimes(1);
});

it('completes an exit when a breakpoint removes its outgoing presentation', () => {
  const inline = setup();
  inline.rerender({ present: false, floating: false, reducedMotion: false });
  expect(inline.complete).not.toHaveBeenCalled();
  inline.rerender({ present: false, floating: true, reducedMotion: false });
  expect(inline.complete).toHaveBeenCalledTimes(1);
  const sheet = setup({ floating: true });
  sheet.rerender({ present: false, floating: false, reducedMotion: false });
  expect(sheet.complete).toHaveBeenCalledTimes(1);
});
