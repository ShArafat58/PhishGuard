/**
 * PhishGuard — Blocklist lookup.
 *
 * Loads a bundled list of known-phishing hostnames and provides a fast,
 * privacy-preserving check for whether a given URL's host is on that list.
 *
 * Privacy: the list is bundled with the extension and matched entirely
 * offline. We never send the user's URL anywhere to check it.
 *
 * Performance: the list is turned into a Set once at module load, so each
 * lookup is O(1) instead of scanning the whole list.
 */

import blocklistData from './data/blocklist.json'

/**
 * Normalises a hostname so lookups are consistent: lower-cased and with a
 * leading "www." removed. The SAME normalisation is applied to both the
 * stored list and the queried host, so they compare fairly.
 */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, '')
}

/**
 * The set of blocklisted hosts, built once from the bundled JSON.
 * Every entry is normalised on the way in.
 */
const blocklistedHosts: Set<string> = new Set(
  blocklistData.hosts.map((host) => normalizeHost(host)),
)

/** The version string of the loaded blocklist (useful for diagnostics). */
export const blocklistVersion: string = blocklistData.version

/**
 * Returns true if the given URL's host is on the blocklist.
 * Safely returns false for URLs that cannot be parsed.
 */
export function isBlocklisted(rawUrl: string): boolean {
  let host: string
  try {
    host = new URL(rawUrl).hostname
  } catch {
    return false // Unparseable URL — cannot match a host.
  }

  return blocklistedHosts.has(normalizeHost(host))
}