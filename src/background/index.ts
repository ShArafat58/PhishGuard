/**
 * PhishGuard — Background Service Worker ("the brain").
 *
 * Listens for messages from the popup and content scripts. It analyses
 * page features, stores each tab's result, keeps the toolbar badge in sync
 * with the active tab, warns the user on dangerous pages, and answers the
 * popup's requests.
 *
 * MV3 note: the service worker is event-driven and may restart at any
 * time, so per-tab state lives in chrome.storage.session (see tabState.ts),
 * and the badge is re-synced from that state on tab activation.
 */

import {
  MessageType,
  type ExtensionMessage,
  type GetCurrentUrlResponse,
  type GetTabResultResponse,
  type ShowWarningRequest,
} from '../lib/type'
import { analyzePage } from '../lib/detection'
import { RiskLevel, type UrlAnalysisResult } from '../lib/detection'
import { saveTabResult, getTabResult, clearTabResult } from '../lib/tabState'
import { updateBadge, clearBadge } from '../lib/badge'

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

/**
 * Re-draws the badge for a tab from its stored result. If there is no
 * stored result (e.g. a fresh tab or an internal page), clears the badge.
 * This keeps the badge correct across tab switches and service-worker
 * restarts.
 */
async function syncBadgeForTab(tabId: number): Promise<void> {
  const result = await getTabResult(tabId)
  if (result) {
    await updateBadge(tabId, result)
  } else {
    await clearBadge(tabId)
  }
}

/**
 * Analyses a page's features, stores the result, updates the badge, and
 * — if the page is dangerous — asks the content script to warn the user.
 */
async function handlePageFeatures(
  message: Extract<ExtensionMessage, { type: 'PAGE_FEATURES' }>,
  tabId: number | undefined,
): Promise<void> {
  const result = analyzePage(message.features)

  console.log(
    `[PhishGuard] Analysis for ${result.url}: ${result.level} ` +
      `(score ${result.totalScore})`,
    result.signals,
  )

  if (typeof tabId !== 'number') return

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

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    // Only trust messages from our own extension.
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

/* -------------------------------------------------------------------------- */
/*  Tab lifecycle: keep the badge in sync with the active tab.                 */
/* -------------------------------------------------------------------------- */

// When the user switches to another tab, re-draw the badge from that tab's
// stored result (or clear it if we have none).
chrome.tabs.onActivated.addListener((activeInfo) => {
  void syncBadgeForTab(activeInfo.tabId)
})

// When a tab navigates to a new URL, its old result is stale. Clear it so
// we do not show a previous page's verdict; the content script will report
// fresh features for the new page.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    void clearTabResult(tabId)
    void clearBadge(tabId)
  }
})

// Clean up stored state when a tab is closed.
chrome.tabs.onRemoved.addListener((tabId) => {
  void clearTabResult(tabId)
})