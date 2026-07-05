/**
 * PhishGuard — Content script
 *
 * Runs inside every web page the user visits. For now it simply notifies
 * the background service worker that it has loaded, and on which URL.
 * In later milestones, this is where we will inspect the page's DOM to
 * look for phishing signals.
 */

import { MessageType, type ContentScriptLoadedRequest } from '../lib/type'

console.log(`[PhishGuard] Content script loaded on: ${window.location.href}`)

// Notify the background that we have loaded on this page.
// This is a one-way message: we do not expect a response.
const message: ContentScriptLoadedRequest = {
  type: MessageType.CONTENT_SCRIPT_LOADED,
  url: window.location.href,
}

chrome.runtime.sendMessage(message).catch((error) => {
  // The service worker may be briefly asleep; a failure here is non-fatal.
  console.debug('[PhishGuard] Could not notify background:', error)
})