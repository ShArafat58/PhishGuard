/**
 * PhishGuard — Popup script.
 *
 * Shows the current tab's URL and analysis verdict, and lets the user
 * trust/untrust the current site (whitelist). All page-derived text is
 * inserted with textContent (never innerHTML) to prevent XSS.
 */

import {
  MessageType,
  type GetCurrentUrlResponse,
  type GetTabResultResponse,
  type ToggleWhitelistResponse,
} from '../lib/type'
import { RiskLevel, type UrlAnalysisResult } from '../lib/detection'
import { isWhitelisted } from '../lib/settings'

/** Human-friendly label for each risk level. */
const LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.SAFE]: 'No threats detected',
  [RiskLevel.SUSPICIOUS]: 'Suspicious — be careful',
  [RiskLevel.DANGEROUS]: 'Dangerous — likely phishing',
}

/** The host of the current tab, resolved during init. */
let currentHost: string | null = null

/** Safely extracts a hostname from a URL. */
function hostOf(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
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

  verdict.dataset.level = result.level
  label.textContent = LEVEL_LABELS[result.level]
  score.textContent = `Score: ${result.totalScore}`
}

/** Renders the list of detected signals. */
function renderSignals(result: UrlAnalysisResult | null): void {
  const caption = document.getElementById('pg-signals-caption')
  const list = document.getElementById('pg-signal-list')
  if (!caption || !list) return

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
    item.textContent = signal.description
    list.appendChild(item)
  }
}

/** Updates the trust button's label and state for the given host. */
async function renderTrustButton(host: string | null): Promise<void> {
  const btn = document.getElementById('pg-trust-btn') as HTMLButtonElement | null
  if (!btn) return

  if (!host) {
    btn.hidden = true
    return
  }

  const trusted = await isWhitelisted(host)
  btn.hidden = false
  btn.textContent = trusted ? '✓ Trusted (click to untrust)' : 'Trust this site'
  btn.dataset.trusted = String(trusted)
}

/** Handles a click on the trust button. */
async function onTrustClick(): Promise<void> {
  if (!currentHost) return

  const btn = document.getElementById('pg-trust-btn') as HTMLButtonElement | null
  const wasTrusted = btn?.dataset.trusted === 'true'

  // Ask for confirmation only when TRUSTING (the risky direction).
  if (!wasTrusted) {
    const ok = window.confirm(
      `Trust "${currentHost}"?\n\n` +
        `PhishGuard will stop warning you about this site. ` +
        `Only do this for sites you are sure are safe.`,
    )
    if (!ok) return
  }

  const response: ToggleWhitelistResponse = await chrome.runtime.sendMessage({
    type: MessageType.TOGGLE_WHITELIST,
    host: currentHost,
  })

  // Reflect the new state, and refresh the verdict view.
  await renderTrustButton(currentHost)
  if (response.whitelisted) {
    renderVerdict({
      url: currentHost,
      totalScore: 0,
      level: RiskLevel.SAFE,
      signals: [],
    })
    renderSignals({
      url: currentHost,
      totalScore: 0,
      level: RiskLevel.SAFE,
      signals: [],
    })
  }
}

/** Loads everything and wires up the UI. */
async function init(): Promise<void> {
  let url: string | null = null
  try {
    const urlResponse: GetCurrentUrlResponse = await chrome.runtime.sendMessage(
      { type: MessageType.GET_CURRENT_URL },
    )
    url = urlResponse?.url ?? null
  } catch {
    url = null
  }
  renderUrl(url)
  currentHost = hostOf(url)

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

  await renderTrustButton(currentHost)

  const btn = document.getElementById('pg-trust-btn')
  btn?.addEventListener('click', () => void onTrustClick())
}

void init()