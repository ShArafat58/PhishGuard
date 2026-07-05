// The service worker is event-driven and can be stopped/restarted by
// the browser at any time. We must NOT rely on long-lived variables here.
console.log('[PhishGuard] Service worker started')

chrome.runtime.onInstalled.addListener(() => {
  console.log('[PhishGuard] Extension installed')
})