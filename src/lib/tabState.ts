/**
 * PhishGuard — Per-tab analysis result store.
 *
 * The MV3 service worker can be stopped and restarted at any time, so we
 * cannot rely on plain in-memory variables to remember each tab's result.
 * We use chrome.storage.session instead: it survives service-worker
 * restarts but is cleared when the browser closes, so nothing is written
 * to disk and no browsing history accumulates (privacy-friendly).
 */

import type { UrlAnalysisResult } from './detection'

/** Builds the storage key for a given tab. */
function keyForTab(tabId: number): string {
  return `tab:${tabId}`
}

/** Saves the latest analysis result for a tab. */
export async function saveTabResult(
  tabId: number,
  result: UrlAnalysisResult,
): Promise<void> {
  await chrome.storage.session.set({ [keyForTab(tabId)]: result })
}

/** Reads the stored result for a tab, or null if there is none. */
export async function getTabResult(
  tabId: number,
): Promise<UrlAnalysisResult | null> {
  const key = keyForTab(tabId)
  const stored = await chrome.storage.session.get(key)
  return (stored[key] as UrlAnalysisResult | undefined) ?? null
}

/** Removes a tab's result (called when the tab is closed). */
export async function clearTabResult(tabId: number): Promise<void> {
  await chrome.storage.session.remove(keyForTab(tabId))
}
