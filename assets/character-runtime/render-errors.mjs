// The recovered engine polls glGetError after uploads and again after drawing.
// Poll once at the shared transaction boundary; deferred batches wait for the
// GPU without blocking JS before validating and publishing their pixels.
// Setup outside a batch keeps exact GL error semantics. No errors are ignored.
export function createRenderErrorBoundary(gl) {
  let rendering = false;
  let touched = false;
  let pending = null;
  let publishing = false;
  function assertAvailable() {
    if (pending && !rendering)
      throw new Error(
        'Character WebGL batch is pending; await waitForSharedRender()',
      );
  }
  const methods = new Map([
    [
      'getError',
      () => {
        assertAvailable();
        if (!rendering) return gl.getError();
        touched = true;
        return gl.NO_ERROR;
      },
    ],
  ]);
  const context = new Proxy(gl, {
    get(target, key) {
      if (methods.has(key)) return methods.get(key);
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      methods.set(key, (...args) => {
        assertAvailable();
        if (rendering) touched = true;
        return value.apply(target, args);
      });
      return methods.get(key);
    },
  });
  function submit(operation) {
    rendering = true;
    touched = false;
    let result, failure;
    try {
      result = operation();
      if (result && typeof result.then === 'function')
        throw new Error('Character WebGL submission must be synchronous');
    } catch (error) {
      failure = error;
    } finally {
      rendering = false;
    }
    return { result, failure };
  }
  function validate({ result, failure }) {
    const errors = [];
    for (let i = 0; touched && i < 32; i++) {
      const error = gl.getError();
      if (error === gl.NO_ERROR) break;
      errors.push(`0x${error.toString(16)}`);
    }
    if (errors.length) {
      const graphicsError = new Error(
        `Character WebGL render failed: ${errors.join(', ')}`,
      );
      if (failure)
        throw new AggregateError(
          [failure, graphicsError],
          graphicsError.message,
        );
      throw graphicsError;
    }
    if (failure) throw failure;
    return result;
  }
  return {
    context,
    assertAvailable,
    assertReadable() {
      if (pending && !publishing)
        throw new Error('Character WebGL pixels are pending validation');
    },
    get pending() {
      return pending !== null;
    },
    // Unrelated creation/cleanup waits for settlement, not the render result.
    // Its owner observes the rejecting promise returned by renderDeferred.
    wait() {
      return pending
        ? pending.then(
            () => {},
            () => {},
          )
        : Promise.resolve();
    },
    render(operation) {
      if (rendering) return operation();
      assertAvailable();
      return validate(submit(operation));
    },
    renderDeferred(
      operation,
      publish,
      { timeoutMs = 5000, pollIntervalMs = 4 } = {},
    ) {
      if (pending || rendering)
        return Promise.reject(
          new Error('Character WebGL batch already in progress'),
        );
      let resolve, reject;
      const completion = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
      pending = completion;
      const submission = submit(operation);
      let fence = null;
      const started = performance.now();
      function finish(failure) {
        try {
          if (fence) gl.deleteSync(fence);
          fence = null;
          if (failure) throw failure;
          const result = validate(submission);
          // Publish while the lock is held. A preparation waiter registered
          // earlier must not mutate the atlas before these 2D copies finish.
          publishing = true;
          try {
            const published = publish?.(result);
            if (published && typeof published.then === 'function')
              throw new Error(
                'Character WebGL publication must be synchronous',
              );
          } finally {
            publishing = false;
          }
          pending = null;
          resolve(result);
        } catch (error) {
          pending = null;
          reject(error);
        }
      }
      function poll() {
        try {
          if (gl.isContextLost())
            throw new Error('Character WebGL context lost');
          const status = gl.clientWaitSync(fence, 0, 0);
          if (
            status === gl.ALREADY_SIGNALED ||
            status === gl.CONDITION_SATISFIED
          ) {
            finish();
            return;
          }
          if (status === gl.WAIT_FAILED)
            throw new Error('Character WebGL fence wait failed');
          if (performance.now() - started >= timeoutMs)
            throw new Error('Character WebGL fence timed out');
          setTimeout(poll, pollIntervalMs);
        } catch (error) {
          finish(error);
        }
      }
      if (!touched) {
        finish();
        return completion;
      }
      try {
        fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!fence) throw new Error('Character WebGL fence unavailable');
        gl.flush();
        setTimeout(poll, pollIntervalMs);
      } catch (error) {
        finish(error);
      }
      return completion;
    },
  };
}
