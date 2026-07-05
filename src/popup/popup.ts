/**
 * PhishGuard — Popup script
 *
 * When the popup opens, it asks the background service worker for the
 * URL of the tab the user is currently viewing, then displays it.
 */

import { MessageType, type GetCurrentUrlResponse } from '../lib/type'

console.log('[PhishGuard] Popup opened')

/**
 * Renders the given URL (or a fallback message) into the popup UI.
 */
function renderUrl(url: string | null): void {
  const urlElement = document.getElementById('pg-url')
  if (!urlElement) return

  if (url) {
    urlElement.textContent = url
  } else {
    urlElement.textContent = 'Not available on this page'
  }
}

/**
 * Asks the background for the active tab's URL and displays the result.
 */
async function loadCurrentUrl(): Promise<void> {
  try {
    const response: GetCurrentUrlResponse = await chrome.runtime.sendMessage({
      type: MessageType.GET_CURRENT_URL,
    })
    renderUrl(response?.url ?? null)
  } catch (error) {
    console.error('[PhishGuard] Failed to get current URL:', error)
    renderUrl(null)
  }
}

// Kick things off as soon as the popup script runs.
loadCurrentUrl()