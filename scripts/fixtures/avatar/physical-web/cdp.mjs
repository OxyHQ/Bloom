/** Dedicated authorized Android test target only; disconnecting never closes a browser or another tab. */
const debug = process.env.AVATAR_WEBVIEW_DEBUG || 'http://localhost:9340';
const targets = await (await fetch(`${debug}/json`)).json();
const expected = process.env.AVATAR_TARGET_URL || 'http://127.0.0.1:';
const target = targets.find((t) => t.type === 'page' && t.url.startsWith(expected));
if (!target) throw Error('No dedicated target');
const endpoint = new URL(target.webSocketDebuggerUrl);
endpoint.host = new URL(debug).host;
const socket = new WebSocket(endpoint);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let nextId = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('close', () => {
  for (const call of pending.values()) {
    clearTimeout(call.timeout);
    call.reject(new Error('Dedicated WebView target closed during the test'));
  }
  pending.clear();
});
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const call = pending.get(message.id);
    if (!call) return;
    pending.delete(message.id);
    clearTimeout(call.timeout);
    if (message.error) call.reject(new Error(JSON.stringify(message.error)));
    else call.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown')
    errors.push(message.params.exceptionDetails);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 180000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (fn, args) => {
  const result = await send('Runtime.evaluate', {
    expression: `(${fn})(${JSON.stringify(args)})`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export { send, evaluate, wait, socket };
