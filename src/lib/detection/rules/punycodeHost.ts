/**
 * Rule: PUNYCODE_HOST
 *
 * Flags "punycode" hostnames (labels starting with "xn--"). Punycode lets
 * non-ASCII characters appear in domains. Attackers abuse this for
 * "homograph" attacks: "аpple.com" using a Cyrillic 'а' looks identical to
 * "apple.com" but is a completely different domain. Browsers encode such
 * hostnames as punycode (e.g. "xn--pple-43d.com").
 */

import { type RiskSignal, Severity, SignalId } from '../types'

export function checkPunycodeHost(url: URL): RiskSignal | null {
  // Each dot-separated label is checked; any "xn--" prefix is a red flag.
  const hasPunycodeLabel = url.hostname
    .toLowerCase()
    .split('.')
    .some((label) => label.startsWith('xn--'))

  if (!hasPunycodeLabel) {
    return null
  }

  return {
    id: SignalId.PUNYCODE_HOST,
    severity: Severity.HIGH,
    score: 30,
    description:
      'The domain uses special characters that can imitate a well-known site.',
  }
}
