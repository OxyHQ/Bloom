// The recovered engine polls glGetError after uploads and again after drawing.
// On mobile these polls synchronize the driver. During a shared batch collect
// errors at its boundary instead; setup/probing outside it keeps exact GL rules.
// Errors are never ignored: a failed transaction cannot publish its pixels.
export function createRenderErrorBoundary(gl) {
  let rendering = false;
  let touched = false;
  const methods = new Map();
  const context = new Proxy(gl, {
    get(target, key) {
      if (key === 'getError')
        return () => {
          if (!rendering) return gl.getError();
          touched = true;
          return gl.NO_ERROR;
        };
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      if (!methods.has(key))
        methods.set(key, (...args) => {
          if (rendering) touched = true;
          return value.apply(target, args);
        });
      return methods.get(key);
    },
  });
  return {
    context,
    render(operation) {
      // A shared batch contains several synchronous character submissions.
      // Only its outer boundary polls; no avatar publishes before that passes.
      if (rendering) return operation();
      rendering = true;
      touched = false;
      let result, failure;
      try {
        result = operation();
      } catch (error) {
        failure = error;
      } finally {
        rendering = false;
      }
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
    },
  };
}
