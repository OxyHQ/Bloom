// One budget per document, including separately imported/versioned adapters.
// Renderers retain their painted 2D canvas when their GPU lease is released.
const key = Symbol.for('bloom.character.render-budget');
export function createRenderBudget(
  limit = 4,
  schedule = (fn) => requestAnimationFrame(fn),
) {
  const entries = new Set();
  let scheduled = false,
    serial = 0,
    peak = 0;
  const resident = (entry) => entry.starting || entry.controller;
  function wake() {
    if (scheduled) return;
    scheduled = true;
    schedule(pump);
  }
  function stop(entry) {
    entry.wanted = false;
    if (entry.controller) {
      const controller = entry.controller;
      entry.controller = null;
      entry.suspend(controller);
    }
  }
  async function start(entry) {
    entry.starting = true;
    peak = Math.max(peak, [...entries].filter(resident).length);
    try {
      const controller = await entry.start();
      if (!entry.wanted || entry.removed) entry.suspend(controller);
      else entry.controller = controller;
    } catch (error) {
      entry.failed = true;
      entry.error(error);
    } finally {
      entry.starting = false;
      if (entry.removed) entries.delete(entry);
      wake();
    }
  }
  function pump() {
    scheduled = false;
    const eligible = [...entries].filter(
      (e) => !e.removed && !e.failed && e.visible,
    );
    const selected = new Set();
    // Explicit work/touch takes precedence. A single preparing surface keeps
    // large lists from constructing dozens of native renderers in one task.
    const ordered = eligible.sort(
      (a, b) => b.priority - a.priority || b.order - a.order,
    );
    let preparing = [...entries].some((e) => resident(e) && e.needsPaint);
    for (const e of ordered.filter((e) => e.priority >= 2)) {
      if (selected.size === limit) break;
      if (e.needsPaint && !resident(e) && preparing) continue;
      selected.add(e);
      if (e.needsPaint) preparing = true;
    }
    // An interactive surface (an editor's live preview) is admitted before
    // passive thumbnails: its capabilities enable the controls around it, and
    // mount order alone left those controls disabled until every avatar
    // mounted earlier had prepared, one at a time.
    const pending = eligible
      .filter((e) => e.needsPaint && !selected.has(e))
      .sort(
        (a, b) =>
          Number(!!resident(b)) - Number(!!resident(a)) ||
          Number(!!b.interactive) - Number(!!a.interactive) ||
          a.order - b.order,
      );
    if (selected.size < limit && pending.length) {
      const next =
        pending.find((e) => resident(e)) ?? (!preparing ? pending[0] : null);
      if (next) selected.add(next);
    }
    for (const e of ordered
      .filter((e) => !e.needsPaint && !e.still)
      .sort(
        (a, b) =>
          b.priority - a.priority ||
          Number(!!resident(b)) - Number(!!resident(a)) ||
          b.order - a.order,
      )) {
      if (selected.size === limit) break;
      selected.add(e);
    }
    for (const e of entries) if (!selected.has(e)) stop(e);
    let count = [...entries].filter(resident).length;
    for (const e of selected) {
      e.wanted = true;
      if (!resident(e) && count < limit) {
        count++;
        void start(e);
        break;
      }
    }
  }
  return {
    register(options) {
      const entry = {
        visible: false,
        priority: 0,
        needsPaint: true,
        still: false,
        interactive: false,
        starting: false,
        controller: null,
        wanted: false,
        removed: false,
        failed: false,
        order: ++serial,
        ...options,
      };
      entries.add(entry);
      wake();
      return {
        update(value) {
          Object.assign(entry, value);
          if (value.priority >= 2) entry.order = ++serial;
          wake();
        },
        painted() {
          if (entry.needsPaint) {
            entry.needsPaint = false;
            wake();
          }
        },
        fail(error) {
          entry.failed = true;
          stop(entry);
          entry.error(error);
          wake();
        },
        dispose() {
          entry.removed = true;
          stop(entry);
          if (!entry.starting) entries.delete(entry);
          wake();
        },
      };
    },
    stats: () => ({
      limit,
      resident: [...entries].filter(resident).length,
      registered: [...entries].filter((e) => !e.removed).length,
      peak,
    }),
  };
}
export const renderBudget = (globalThis[key] ??= createRenderBudget());
