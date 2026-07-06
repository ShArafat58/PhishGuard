/**
 * PhishGuard — Background Service Worker ("the brain").
 *
 * Applies user settings (master switch + whitelist), analyses page
 * features, stores each tab's result, keeps the badge in sync, warns the
 * user on dangerous pages, toggles whitelist entries, and answers the
 * popup's requests.
 *
 * MV3 note: the service worker is event-driven and may restart at any
 * time, so per-tab state lives in chrome.storage.session (tabState.ts) and
 * user settings live in chrome.storage.local (settings.ts).
 */

import {
  MessageType,
  type ExtensionMessage,
  type GetCurrentUrlResponse,
  type GetTabResultResponse,
  type ToggleWhitelistResponse,
  type ShowWarningRequest,
} from '../lib/type'
import { analyzePage } from '../lib/detection'
import {
  RiskLevel,
  type UrlAnalysisResult,
  type RiskSignal,
} from '../lib/detection'
import { saveTabResult, getTabResult, clearTabResult } from '../lib/tabState'
import { updateBadge, clearBadge } from '../lib/badge'
import {
  getSettings,
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
} from '../lib/settings'

console.log('[PhishGuard] Service worker started')

/** Finds the tab the user is currently viewing. */
async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  return tab
}

/** Picks a short human reason from the highest-scoring signal, if any. */
function topReason(result: UrlAnalysisResult): string {
  if (result.signals.length === 0) return ''
  const top = [...result.signals].sort((a, b) => b.score - a.score)[0]
  return top.description
}

/** Re-draws the badge for a tab from its stored result, or clears it. */
async function syncBadgeForTab(tabId: number): Promise<void> {
  const result = await getTabResult(tabId)
  if (result) {
    await updateBadge(tabId, result)
  } else {
    await clearBadge(tabId)
  }
}

/** Builds a "clean" SAFE result (used for whitelisted pages). */
function safeResult(url: string): UrlAnalysisResult {
  const noSignals: RiskSignal[] = []
  return { url, totalScore: 0, level: RiskLevel.SAFE, signals: noSignals }
}

/** Extracts a hostname from a URL, or null if it cannot be parsed. */
function hostOf(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname
  } catch {
    return null
  }
}

/**
 * Analyses a page's features — subject to the user's settings — then
 * stores the result, updates the badge, and warns on dangerous pages.
 */
async function handlePageFeatures(
  message: Extract<ExtensionMessage, { type: 'PAGE_FEATURES' }>,
  tabId: number | undefined,
): Promise<void> {
  const features = message.features
  const settings = await getSettings()

  if (typeof tabId !== 'number') return

  if (!settings.enabled) {
    await clearTabResult(tabId)
    await clearBadge(tabId)
    return
  }

  const host = hostOf(features.pageUrl)
  if (host && (await isWhitelisted(host))) {
    const result = safeResult(features.pageUrl)
    await saveTabResult(tabId, result)
    await clearBadge(tabId)
    console.log(`[PhishGuard] ${features.pageUrl} is whitelisted — skipped.`)
    return
  }

  const result = analyzePage(features)

  console.log(
    `[PhishGuard] Analysis for ${result.url}: ${result.level} ` +
      `(score ${result.totalScore})`,
    result.signals,
  )

  await saveTabResult(tabId, result)
  await updateBadge(tabId, result)

  if (result.level === RiskLevel.DANGEROUS) {
    const warning: ShowWarningRequest = {
      type: MessageType.SHOW_WARNING,
      reason: topReason(result),
    }
    chrome.tabs.sendMessage(tabId, warning).catch(() => {
      /* tab may have navigated away — non-fatal */
    })
  }
}

/** Handles the popup asking for the current tab's stored result. */
async function handleGetTabResult(
  sendResponse: (response: GetTabResultResponse) => void,
): Promise<void> {
  const tab = await getActiveTab()
  if (typeof tab?.id !== 'number') {
    sendResponse({ result: null })
    return
  }
  const result = await getTabResult(tab.id)
  sendResponse({ result })
}

/**
 * Toggles a host in the whitelist. If it was trusted, it becomes untrusted
 * and vice-versa. Re-syncs the badge for the active tab afterwards.
 */
async function handleToggleWhitelist(
  host: string,
  sendResponse: (response: ToggleWhitelistResponse) => void,
): Promise<void> {
  const currentlyWhitelisted = await isWhitelisted(host)

  if (currentlyWhitelisted) {
    await removeFromWhitelist(host)
  } else {
    await addToWhitelist(host)
  }

  // Re-analyse or re-sync the active tab so the change takes effect now.
  const tab = await getActiveTab()
  if (typeof tab?.id === 'number') {
    if (!currentlyWhitelisted) {
      // Just trusted → mark SAFE immediately.
      await saveTabResult(tab.id, safeResult(tab.url ?? host))
      await clearBadge(tab.id)
    } else {
      // Just untrusted → clear so the next page load re-analyses.
      await clearTabResult(tab.id)
      await clearBadge(tab.id)
    }
  }

  sendResponse({ whitelisted: !currentlyWhitelisted })
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) {
      console.warn('[PhishGuard] Ignored message from unknown sender:', sender.id)
      return false
    }

    switch (message.type) {
      case MessageType.GET_CURRENT_URL: {
        getActiveTab().then((tab) => {
          const response: GetCurrentUrlResponse = { url: tab?.url ?? null }
          sendResponse(response)
        })
        return true
      }

      case MessageType.GET_TAB_RESULT: {
        void handleGetTabResult(sendResponse)
        return true
      }

      case MessageType.TOGGLE_WHITELIST: {
        void handleToggleWhitelist(message.host, sendResponse)
        return true
      }

      case MessageType.CONTENT_SCRIPT_LOADED: {
        console.log(
          `[PhishGuard] Content script reported load on: ${message.url}`,
        )
        return false
      }

      case MessageType.PAGE_FEATURES: {
        void handlePageFeatures(message, sender.tab?.id)
        return false
      }

      default: {
        console.warn('[PhishGuard] Received unknown message type:', message)
        return false
      }
    }
  },
)

chrome.tabs.onActivated.addListener((activeInfo) => {
  void syncBadgeForTab(activeInfo.tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    void clearTabResult(tabId)
    void clearBadge(tabId)
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearTabResult(tabId)
})