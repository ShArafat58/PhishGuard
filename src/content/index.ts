// This runs inside every web page. For now it only proves it loaded.
// Later, this is where we will read the page's DOM to look for phishing signs.
console.log(`[PhishGuard] Content script loaded on: ${window.location.href}`)