import {
  type ActionStatus,
  type ActionView,
  action,
  DataProvider,
  environment,
  model,
  StoreClosedError,
  setActiveStore,
  Store,
  useAction,
  useActionStatus,
} from '../index';
import { render, settle } from './support/render';

const Count = model<number>('action-state-count');

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let store: Store;
beforeEach(() => {
  store = new Store();
  setActiveStore(store);
  environment.setOnline(true);
});
afterEach(() => {
  environment.setOnline(true);
});

describe('useAction', () => {
  it('reports the last call: pending, then its result or its error', async () => {
    let server = deferred<number>();
    const save = action({ run: () => server.promise });
    const views: ActionView<[], number>[] = [];
    function Saver() {
      views.push(useAction(save));
      return null;
    }
    render(
      <DataProvider store={store}>
        <Saver />
      </DataProvider>,
    );
    const last = () => views[views.length - 1] as ActionView<[], number>;
    let call: Promise<unknown> = Promise.resolve();
    await settle(() => {
      call = last().run();
    });
    expect(last().isPending).toBe(true);
    await settle(async () => {
      server.resolve(7);
      await call;
    });
    expect(last()).toMatchObject({ isPending: false, data: 7, error: null });

    server = deferred<number>();
    await settle(() => {
      call = last()
        .run()
        .catch(() => undefined);
    });
    await settle(async () => {
      server.reject(new Error('refused'));
      await call;
    });
    expect(last().error).toEqual(new Error('refused'));
    await settle(() => last().reset());
    expect(last()).toMatchObject({ isPending: false, error: null, data: undefined });
  });
});

describe('offline actions', () => {
  it('show the change at once, wait for the network as paused, then run', async () => {
    const run = jest.fn(async () => 1);
    const bump = action({ optimistic: () => Count.set((n) => (n ?? 0) + 1), run });
    const statuses: ActionStatus[] = [];
    function Indicator() {
      statuses.push(useActionStatus());
      return null;
    }
    render(
      <DataProvider store={store}>
        <Indicator />
      </DataProvider>,
    );
    environment.setOnline(false);
    let call: Promise<unknown> = Promise.resolve();
    await settle(() => {
      call = bump();
    });
    expect(Count.get()).toBe(1);
    expect(run).not.toHaveBeenCalled();
    expect(statuses[statuses.length - 1]).toEqual({ pending: 0, paused: 1 });
    await settle(async () => {
      environment.setOnline(true);
      await call;
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(Count.get()).toBe(1);
    expect(statuses[statuses.length - 1]).toEqual({ pending: 0, paused: 0 });
  });

  it('drop a call still waiting when its account is left', async () => {
    const run = jest.fn(async () => 1);
    const bump = action({ optimistic: () => Count.set(5), run });
    environment.setOnline(false);
    const call = bump();
    await store.close();
    await expect(call).rejects.toBeInstanceOf(StoreClosedError);
    expect(run).not.toHaveBeenCalled();
  });
});
