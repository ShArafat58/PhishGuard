/**
 * Rule: BLOCKLISTED_HOST
 *
 * Flags URLs whose host appears on our bundled list of known-phishing
 * hostnames. Unlike the heuristic rules (which GUESS based on patterns),
 * a blocklist match means the site has already been identified as phishing
 * by threat-intelligence data. It therefore carries the highest score, so
 * a match alone is enough to classify the page as DANGEROUS.
 *
 * The check is performed entirely offline (see blocklist.ts), so the
 * user's URL is never sent anywhere.
 */

import { type RiskSignal, Severity, SignalId } from '../types'
import { isBlocklisted } from '../blocklist'

export function checkBlocklistedHost(rawUrl: string): RiskSignal | null {
  if (!isBlocklisted(rawUrl)) {
    return null
  }

  return {
    id: SignalId.BLOCKLISTED_HOST,
    severity: Severity.HIGH,
    // High enough that a match on its own crosses the DANGEROUS threshold.
    score: 60,
    description: 'This site is on a known-phishing blocklist.',
  }
}
