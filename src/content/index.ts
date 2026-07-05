/**
 * PhishGuard — Content script ("the eyes").
 *
 * Runs inside every web page. It collects a small set of DOM features and
 * sends them to the background service worker for analysis. It makes no
 * judgements itself — that is the background's job.
 */

import { collectPageFeatures } from '../lib/detection'
import { MessageType, type PageFeaturesRequest } from '../lib/type'

console.log(`[PhishGuard] Content script loaded on: ${window.location.href}`)

/**
 * Collects page features and sends them to the background.
 * Wrapped defensively so a hostile or unusual page cannot break us.
 */
function reportPageFeatures(): void {
  try {
    const features = collectPageFeatures()

    const message: PageFeaturesRequest = {
      type: MessageType.PAGE_FEATURES,
      features,
    }

    chrome.runtime.sendMessage(message).catch((error) => {
      // The service worker may be briefly asleep; non-fatal.
      console.debug('[PhishGuard] Could not send page features:', error)
    })
  } catch (error) {
    console.debug('[PhishGuard] Feature collection failed:', error)
  }
}

reportPageFeatures()