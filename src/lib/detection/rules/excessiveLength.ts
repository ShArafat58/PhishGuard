/**
 * Rule: EXCESSIVE_LENGTH
 *
 * Flags unusually long URLs. Phishing links are often padded with long
 * subdomains, redirects, or tracking parameters to hide the true domain.
 * This is a weak signal on its own, so it carries a low score.
 */

import { type RiskSignal, Severity, SignalId } from '../types'

/** URLs longer than this are considered unusually long. */
const LENGTH_THRESHOLD = 100

export function checkExcessiveLength(rawUrl: string): RiskSignal | null {
  if (rawUrl.length <= LENGTH_THRESHOLD) {
    return null // Normal length — no signal.
  }

  return {
    id: SignalId.EXCESSIVE_LENGTH,
    severity: Severity.LOW,
    score: 10,
    description:
      'The URL is unusually long, which can be used to hide its true destination.',
  }
}
