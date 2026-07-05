/**
 * Rule: IP_ADDRESS_HOST
 *
 * Flags URLs whose hostname is a raw IP address instead of a domain name.
 * Legitimate businesses use registered domain names (e.g. paypal.com).
 * A bare IP (e.g. http://192.0.2.55/login) often points to a throwaway
 * server set up by an attacker.
 */

import { type RiskSignal, Severity, SignalId } from '../types'

/** Matches a full IPv4 address, e.g. "203.0.113.5". */
const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/

export function checkIpAddressHost(url: URL): RiskSignal | null {
  const host = url.hostname

  // IPv6 hosts appear inside brackets, e.g. "[2001:db8::1]".
  const isIpv6 = host.startsWith('[') && host.endsWith(']')
  const isIpv4 = IPV4_PATTERN.test(host)

  if (!isIpv4 && !isIpv6) {
    return null // A normal domain name — no signal.
  }

  return {
    id: SignalId.IP_ADDRESS_HOST,
    severity: Severity.HIGH,
    score: 35,
    description: 'The site uses a raw IP address instead of a domain name.',
  }
}