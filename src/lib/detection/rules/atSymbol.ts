/**
 * Rule: AT_SYMBOL_IN_URL
 *
 * Flags URLs containing an "@" before the host. Browsers ignore everything
 * before the "@" in the authority part, so https://paypal.com@evil.com
 * actually navigates to evil.com while appearing to show paypal.com.
 * This is a classic phishing deception.
 */

import { type RiskSignal, Severity, SignalId } from '../types'

export function checkAtSymbol(rawUrl: string): RiskSignal | null {
  // We inspect the part BEFORE any path/query, i.e. the authority section.
  // Everything up to the first single "/" after the protocol.
  const withoutProtocol = rawUrl.replace(/^[a-z]+:\/\//i, '')
  const authority = withoutProtocol.split('/')[0]

  if (!authority.includes('@')) {
    return null // No "@" trick — no signal.
  }

  return {
    id: SignalId.AT_SYMBOL_IN_URL,
    severity: Severity.HIGH,
    score: 35,
    description:
      'The URL uses an "@" symbol, which can hide the real destination.',
  }
}
