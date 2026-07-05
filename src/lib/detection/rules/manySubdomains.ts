/**
 * Rule: MANY_SUBDOMAINS
 *
 * Flags hostnames with an unusually high number of subdomain levels.
 * Attackers use long subdomain chains to push a trusted-looking name to
 * the front, e.g. "paypal.com.secure-login.account-verify.xyz", where the
 * REAL registered domain is "xyz" — not paypal.
 */

import { type RiskSignal, Severity, SignalId } from '../types'

/** Hostnames with more dot-separated labels than this are suspicious. */
const MAX_REASONABLE_LABELS = 4

export function checkManySubdomains(url: URL): RiskSignal | null {
  const host = url.hostname

  // Raw IPs are handled by a different rule; skip them here.
  if (/^[\d.]+$/.test(host)) {
    return null
  }

  // "www.mail.google.com" -> ["www","mail","google","com"] = 4 labels.
  const labelCount = host.split('.').length

  if (labelCount <= MAX_REASONABLE_LABELS) {
    return null
  }

  return {
    id: SignalId.MANY_SUBDOMAINS,
    severity: Severity.MEDIUM,
    score: 20,
    description:
      'The address has many subdomain levels, which can disguise the real site.',
  }
}