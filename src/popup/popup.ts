/**
 * PhishGuard — Popup script.
 *
 * When opened, the popup asks the background for the current tab's URL and
 * its stored analysis result, then renders a clear, human-readable verdict:
 * the risk level, the score, and the list of detected signals.
 *
 * SECURITY: all page-derived text (URL, signal descriptions) is inserted
 * with textContent — never innerHTML — to prevent any HTML/script from a
 * malicious page's data being executed inside the popup (XSS).
 */

import {
  MessageType,
  type GetCurrentUrlResponse,
  type GetTabResultResponse,
} from '../lib/type'
import { RiskLevel, type UrlAnalysisResult } from '../lib/detection'

/** Human-friendly label for each risk level. */
const LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.SAFE]: 'No threats detected',
  [RiskLevel.SUSPICIOUS]: 'Suspicious — be careful',
  [RiskLevel.DANGEROUS]: 'Dangerous — likely phishing',
}

/** Renders the current site's URL. */
function renderUrl(url: string | null): void {
  const el = document.getElementById('pg-site-url')
  if (!el) return
  el.textContent = url ?? 'Not available on this page'
}

/** Renders the risk verdict badge and score. */
function renderVerdict(result: UrlAnalysisResult | null): void {
  const verdict = document.getElementById('pg-verdict')
  const label = document.getElementById('pg-verdict-label')
  const score = document.getElementById('pg-verdict-score')
  if (!verdict || !label || !score) return

  if (!result) {
    verdict.dataset.level = 'unknown'
    label.textContent = 'No analysis yet'
    score.textContent = ''
    return
  }

  // data-level drives the colour via CSS.
  verdict.dataset.level = result.level
  label.textContent = LEVEL_LABELS[result.level]
  score.textContent = `Score: ${result.totalScore}`
}

/** Renders the list of detected signals. */
function renderSignals(result: UrlAnalysisResult | null): void {
  const caption = document.getElementById('pg-signals-caption')
  const list = document.getElementById('pg-signal-list')
  if (!caption || !list) return

  // Clear any previous content.
  list.replaceChildren()

  if (!result || result.signals.length === 0) {
    caption.textContent = result ? 'No warning signs found.' : ''
    return
  }

  caption.textContent = 'Warning signs:'

  for (const signal of result.signals) {
    const item = document.createElement('li')
    item.className = 'pg-signal'
    item.dataset.severity = signal.severity
    // textContent (not innerHTML) — the description may reflect page data.
    item.textContent = signal.description
    list.appendChild(item)
  }
}

/** Loads URL + result from the background and renders everything. */
async function init(): Promise<void> {
  try {
    const urlResponse: GetCurrentUrlResponse = await chrome.runtime.sendMessage(
      { type: MessageType.GET_CURRENT_URL },
    )
    renderUrl(urlResponse?.url ?? null)
  } catch {
    renderUrl(null)
  }

  try {
    const resultResponse: GetTabResultResponse =
      await chrome.runtime.sendMessage({ type: MessageType.GET_TAB_RESULT })
    const result = resultResponse?.result ?? null
    renderVerdict(result)
    renderSignals(result)
  } catch {
    renderVerdict(null)
    renderSignals(null)
  }
}

init()