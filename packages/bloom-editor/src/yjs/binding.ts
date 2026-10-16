/**
 * Keeping an editor store and a `Y.Doc` the same.
 *
 * Every transaction the person makes (an edit, an undo, a redo) is written
 * into the `Y.Doc` (`write.ts`). Every change the `Y.Doc` takes from anywhere
 * else — a collaborator, work saved on this device, a server — is read back
 * (`materialize.ts`) and applied to the store as a remote transaction
 * (`diff.ts`): outside the undo history, the selection kept.
 */
import * as Y from 'yjs';
import type { EditorStore } from '../model/store';
import { diffDocuments } from './diff';
import { blocksMap } from './layout';
import { Materializer } from './materialize';
import { writeTransaction } from './write';

export interface YjsBindingOptions {
  /** Take changes from the `Y.Doc` but write nothing into it. */
  readOnly?: boolean;
}

export class YjsBinding {
  private readonly materializer = new Materializer();
  private readonly stopStore: () => void;
  private readonly stopDoc: () => void;

  constructor(
    readonly store: EditorStore,
    readonly doc: Y.Doc,
    options: YjsBindingOptions = {},
  ) {
    // The store starts as the document holds it.
    store.reset(this.materializer.read(doc, store.doc));

    this.stopStore = store.onTransaction((tx, origin) => {
      if (origin === 'remote' || options.readOnly) return;
      writeTransaction(doc, tx, store.doc, this);
    });

    const blocks = blocksMap(doc);
    const observer = (events: Y.YEvent<Y.AbstractType<unknown>>[], tr: Y.Transaction) => {
      const changed = new Set<string>();
      for (const event of events) {
        if (event instanceof Y.YMapEvent && event.target === blocks) {
          for (const key of event.keysChanged) changed.add(key);
        } else {
          const id = event.path[0];
          if (typeof id === 'string') changed.add(id);
        }
      }
      this.materializer.touch(changed);
      // Its own writes are already in the store.
      if (tr.origin === this) return;
      const next = this.materializer.read(doc, store.doc);
      const ops = diffDocuments(store.doc, next);
      if (ops.length > 0) store.dispatch({ ops }, 'remote');
    };
    blocks.observeDeep(observer);
    this.stopDoc = () => blocks.unobserveDeep(observer);
  }

  dispose(): void {
    this.stopStore();
    this.stopDoc();
  }
}
