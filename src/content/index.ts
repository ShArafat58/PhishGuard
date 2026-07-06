/**
 * PhishGuard — Content script ("the eyes" and "the hands").
 *
 * Runs inside every web page. It collects DOM features and sends them to
 * the background for analysis. It also listens for the background's
 * instruction to show an on-page danger warning. It makes no judgements
 * itself — the background decides when a warning is needed.
 */

import { collectPageFeatures } from '../lib/detection'
import {
  MessageType,
  type PageFeaturesRequest,
  type ContentMessage,
} from '../lib/type'
import { showWarningBanner } from './warningBanner'

console.log(`[PhishGuard] Content script loaded on: ${window.location.href}`)

/** Collects page features and sends them to the background. */
function reportPageFeatures(): void {
  try {
    const features = collectPageFeatures()
    const message: PageFeaturesRequest = {
      type: MessageType.PAGE_FEATURES,
      features,
    }
    chrome.runtime.sendMessage(message).catch((error) => {
      console.debug('[PhishGuard] Could not send page features:', error)
    })
  } catch (error) {
    console.debug('[PhishGuard] Feature collection failed:', error)
  }
}

// Listen for instructions from the background (e.g. show a warning).
chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === MessageType.SHOW_WARNING) {
    showWarningBanner(message.reason)
  }
  // We do not send a response, so no need to return true.
})

reportPageFeatures()
