/**
 * PhishGuard — Minimal chrome API mock for tests.
 *
 * settings.ts and other modules call chrome.storage.local, which only
 * exists inside a real browser. In the Vitest (Node) environment there is
 * no `chrome`, so we provide a tiny fake that behaves like chrome.storage
 * by keeping data in a plain in-memory object.
 *
 * This lets us test storage-dependent logic with no browser at all.
 */

import { vi } from 'vitest'

/** Creates a fresh fake chrome.storage.local backed by an in-memory store. */
export function createChromeMock() {
  // The in-memory backing store, mimicking chrome.storage.local's data.
  let store: Record<string, unknown> = {}

  const local = {
    // chrome.storage.local.get accepts a key (or keys) and resolves with
    // an object of the matching key/value pairs.
    get: vi.fn(async (key: string) => {
      return key in store ? { [key]: store[key] } : {}
    }),

    // chrome.storage.local.set merges the given object into the store.
    set: vi.fn(async (items: Record<string, unknown>) => {
      store = { ...store, ...items }
    }),

    // chrome.storage.local.remove deletes a key.
    remove: vi.fn(async (key: string) => {
      delete store[key]
    }),

    // Test helper: wipe everything between tests.
    _reset: () => {
      store = {}
    },
  }

  return {
    storage: {
      local,
      // A session store with the same shape, in case other tests need it.
      session: { ...local, _reset: local._reset },
    },
  }
}
