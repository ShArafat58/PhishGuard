/**
 * PhishGuard — Toolbar badge control.
 *
 * Turns a RiskLevel into a small coloured badge on the extension icon so
 * the user can see a site's risk at a glance, without opening the popup.
 * The badge always reflects the stored result of the ACTIVE tab.
 */

import { RiskLevel, type UrlAnalysisResult } from './detection'

/** Visual style (text + colour) for each risk level. */
const BADGE_STYLES: Record<RiskLevel, { text: string; color: string }> = {
  [RiskLevel.SAFE]: { text: '', color: '#16a34a' }, // green, no text = clean
  [RiskLevel.SUSPICIOUS]: { text: '!', color: '#d97706' }, // amber
  [RiskLevel.DANGEROUS]: { text: '!', color: '#dc2626' }, // red
}

/**
 * Updates the badge for a specific tab based on its analysis result.
 * Setting badge state per-tabId keeps each tab independent.
 */
export async function updateBadge(
  tabId: number,
  result: UrlAnalysisResult,
): Promise<void> {
  const style = BADGE_STYLES[result.level]

  await chrome.action.setBadgeText({ tabId, text: style.text })
  await chrome.action.setBadgeBackgroundColor({ tabId, color: style.color })
}

/**
 * Clears the badge for a specific tab (e.g. a page we have not analysed
 * yet, or an internal chrome:// page). We swallow errors because the tab
 * may have been closed between the caller's check and this call.
 */
export async function clearBadge(tabId: number): Promise<void> {
  try {
    await chrome.action.setBadgeText({ tabId, text: '' })
  } catch {
    /* tab may no longer exist — non-fatal */
  }
}