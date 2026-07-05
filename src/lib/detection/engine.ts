/**
 * PhishGuard — URL Analysis Engine.
 *
 * This is the "conductor" of URL-based detection. It parses a URL once,
 * runs every heuristic rule against it, and collects the signals that
 * fired. Scoring and final risk classification are handled separately
 * (see the scorer, added in the next step).
 *
 * Adding a new rule = write the rule file, then register it in one of the
 * two arrays below. Nothing else changes. (Open/Closed principle.)
 */

import type { RiskSignal } from './types'

import { checkNoHttps } from './rules/noHttps'
import { checkIpAddressHost } from './rules/ipAddressHost'
import { checkAtSymbol } from './rules/atSymbol'
import { checkExcessiveLength } from './rules/excessiveLength'
import { checkManySubdomains } from './rules/manySubdomains'
import { checkSuspiciousTld } from './rules/suspiciousTld'
import { checkPunycodeHost } from './rules/punycodeHost'

/**
 * Rules that operate on a parsed URL object (protocol, hostname, etc.).
 */
const URL_OBJECT_RULES: Array<(url: URL) => RiskSignal | null> = [
  checkNoHttps,
  checkIpAddressHost,
  checkManySubdomains,
  checkSuspiciousTld,
  checkPunycodeHost,
]

/**
 * Rules that need the raw URL string (e.g. to inspect the "@" trick or
 * total length before parsing normalises things away).
 */
const RAW_STRING_RULES: Array<(rawUrl: string) => RiskSignal | null> = [
  checkAtSymbol,
  checkExcessiveLength,
]

/**
 * Runs all heuristic rules against a single URL and returns the list of
 * signals that fired. Returns an empty array for a clean URL.
 *
 * If the URL cannot be parsed at all, that itself is treated as a signal.
 */
export function analyzeUrl(rawUrl: string): RiskSignal[] {
  const signals: RiskSignal[] = []

  // 1) Run rules that work on the raw string first.
  for (const rule of RAW_STRING_RULES) {
    const signal = rule(rawUrl)
    if (signal) signals.push(signal)
  }

  // 2) Parse the URL safely and run object-based rules.
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    // A URL we cannot even parse is inherently suspicious. We stop here
    // because the object-based rules cannot run without a valid URL.
    return signals
  }

  for (const rule of URL_OBJECT_RULES) {
    const signal = rule(parsed)
    if (signal) signals.push(signal)
  }

  return signals
}