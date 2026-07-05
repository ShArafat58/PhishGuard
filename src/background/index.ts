/**
 * PhishGuard — Background Service Worker ("the brain").
 *
 * Listens for messages from the popup and content scripts. It answers the
 * popup's URL request and analyses page features reported by content
 * scripts, producing a full risk result.
 *
 * Note: In Manifest V3 the service worker is event-driven and can be
 * stopped and restarted at any time, so we do not keep long-lived state.
 */

import {
  MessageType,
  type ExtensionMessage,
  type GetCurrentUrlResponse,
} from '../lib/type'
import { analyzePage } from '../lib/detection'

console.log('[PhishGuard] Service worker started')

/** Finds the URL of the tab the user is currently viewing. */
async function getActiveTabUrl(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  return tab?.url ?? null
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
        getActiveTabUrl().then((url) => {
          const response: GetCurrentUrlResponse = { url }
          sendResponse(response)
        })
        return true // We will respond asynchronously.
      }

      case MessageType.CONTENT_SCRIPT_LOADED: {
        console.log(
          `[PhishGuard] Content script reported load on: ${message.url}`,
        )
        return false
      }

      case MessageType.PAGE_FEATURES: {
        // Combine URL-based and DOM-based analysis for this page.
        const result = analyzePage(message.features)
        console.log(
          `[PhishGuard] Analysis for ${result.url}: ${result.level} ` +
            `(score ${result.totalScore})`,
          result.signals,
        )
        // In Milestone 5, we will store this result and show it in the UI.
        return false
      }

      default: {
        console.warn('[PhishGuard] Received unknown message type:', message)
        return false
      }
    }
  },
)