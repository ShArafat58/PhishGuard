/**
 * PhishGuard — Background Service Worker
 *
 * This is the extension's central coordinator. It listens for messages
 * from the popup and content scripts, and responds to them. In later
 * milestones, this is also where phishing risk scoring will happen.
 *
 * Note: In Manifest V3 the service worker is event-driven and can be
 * stopped and restarted by the browser at any time, so we must NOT rely
 * on long-lived variables to hold state. We use event listeners instead.
 */

import {
  MessageType,
  type ExtensionMessage,
  type GetCurrentUrlResponse,
} from '../lib/type'

console.log('[PhishGuard] Service worker started')

/**
 * Finds the URL of the tab the user is currently looking at.
 *
 * We use `activeTab`-friendly querying: the currently active tab in the
 * last focused window. Returns null if no valid URL can be determined
 * (for example on internal chrome:// pages).
 */
async function getActiveTabUrl(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })
  return tab?.url ?? null
}

/**
 * Central message listener. Every message from the popup or content
 * scripts arrives here.
 *
 * IMPORTANT: We return `true` at the end so Chrome keeps the message
 * channel open for our asynchronous `sendResponse` call. Without it,
 * the popup would never receive a reply.
 */
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    // Basic origin sanity check: we only trust messages that come from
    // our own extension (popup) or from a content script running in a
    // real browser tab. We ignore anything else.
    const isFromOurExtension = sender.id === chrome.runtime.id
    if (!isFromOurExtension) {
      console.warn('[PhishGuard] Ignored message from unknown sender:', sender.id)
      return false
    }

    switch (message.type) {
      case MessageType.GET_CURRENT_URL: {
        // Async work: fetch the active tab's URL, then reply.
        getActiveTabUrl().then((url) => {
          const response: GetCurrentUrlResponse = { url }
          sendResponse(response)
        })
        // Tell Chrome we will respond asynchronously.
        return true
      }

      case MessageType.CONTENT_SCRIPT_LOADED: {
        // One-way notification: no response needed, just log it.
        console.log(
          `[PhishGuard] Content script reported load on: ${message.url}`,
        )
        return false
      }

      default: {
        // This should never happen if types are correct, but we handle
        // it defensively. TypeScript treats `message` as `never` here.
        console.warn('[PhishGuard] Received unknown message type:', message)
        return false
      }
    }
  },
)