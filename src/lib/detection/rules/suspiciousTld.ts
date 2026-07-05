/**
 * Rule: SUSPICIOUS_TLD
 *
 * Flags top-level domains (TLDs) that are disproportionately abused for
 * phishing and malware because they are cheap or free to register.
 * A legitimate bank is unlikely to live on a ".zip" or ".tk" domain.
 *
 * NOTE: This is a heuristic, not proof. Plenty of harmless sites use these
 * TLDs, so this rule carries a modest score and must be combined with
 * other signals.
 */

import { type RiskSignal, Severity, SignalId } from '../types'

/**
 * A small starter list of TLDs frequently reported in phishing/abuse data.
 * This is intentionally conservative and can be tuned later.
 */
const SUSPICIOUS_TLDS = new Set([
  'zip',
  'mov',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'xyz',
  'top',
  'work',
])

export function checkSuspiciousTld(url: URL): RiskSignal | null {
  const labels = url.hostname.toLowerCase().split('.')
  const tld = labels[labels.length - 1]

  if (!SUSPICIOUS_TLDS.has(tld)) {
    return null
  }

  return {
    id: SignalId.SUSPICIOUS_TLD,
    severity: Severity.LOW,
    score: 15,
    description: `The site uses a ".${tld}" domain, a type often abused for phishing.`,
  }
}