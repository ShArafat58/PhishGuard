/**
 * Rule: NO_HTTPS
 *
 * Flags URLs that are not served over HTTPS. Legitimate sites that ask
 * for credentials almost always use HTTPS to encrypt traffic. A plain
 * http:// page (especially one with a login form) is a warning sign.
 */

import { type RiskSignal, Severity, SignalId } from '../types'

export function checkNoHttps(url: URL): RiskSignal | null {
  // URL.protocol includes the trailing colon, e.g. "https:" or "http:".
  if (url.protocol === 'https:') {
    return null // Secure — no signal.
  }

  return {
    id: SignalId.NO_HTTPS,
    severity: Severity.MEDIUM,
    score: 20,
    description: 'The site does not use a secure HTTPS connection.',
  }
}