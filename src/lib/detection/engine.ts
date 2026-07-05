/**
 * PhishGuard — Detection engine.
 *
 * The "conductor" of detection. It runs URL-based rules against a URL and
 * DOM-based rules against collected page features, and collects the signals
 * that fired.
 *
 * Adding a new rule = write the rule file, then register it in the right
 * array below. Nothing else changes. (Open/Closed principle.)
 */

import type { RiskSignal, PageFeatures } from './types'

// --- URL-based rules (Milestone 3) ---
import { checkNoHttps } from './rules/noHttps'
import { checkIpAddressHost } from './rules/ipAddressHost'
import { checkAtSymbol } from './rules/atSymbol'
import { checkExcessiveLength } from './rules/excessiveLength'
import { checkManySubdomains } from './rules/manySubdomains'
import { checkSuspiciousTld } from './rules/suspiciousTld'
import { checkPunycodeHost } from './rules/punycodeHost'

// --- DOM-based rules (Milestone 4) ---
import { checkPasswordFieldNoHttps } from './rules/dom/passwordFieldNoHttps'
import { checkFormActionMismatch } from './rules/dom/formActionMismatch'
import { checkInsecureFormAction } from './rules/dom/insecureFormAction'

/** URL rules that operate on a parsed URL object. */
const URL_OBJECT_RULES: Array<(url: URL) => RiskSignal | null> = [
  checkNoHttps,
  checkIpAddressHost,
  checkManySubdomains,
  checkSuspiciousTld,
  checkPunycodeHost,
]

/** URL rules that need the raw URL string. */
const RAW_STRING_RULES: Array<(rawUrl: string) => RiskSignal | null> = [
  checkAtSymbol,
  checkExcessiveLength,
]

/** DOM rules that operate on collected page features. */
const DOM_RULES: Array<(features: PageFeatures) => RiskSignal | null> = [
  checkPasswordFieldNoHttps,
  checkFormActionMismatch,
  checkInsecureFormAction,
]

/**
 * Runs all URL-based rules against a single URL and returns the signals
 * that fired. Returns an empty array for a clean URL.
 */
export function analyzeUrl(rawUrl: string): RiskSignal[] {
  const signals: RiskSignal[] = []

  for (const rule of RAW_STRING_RULES) {
    const signal = rule(rawUrl)
    if (signal) signals.push(signal)
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return signals // Unparseable URL: return what the string rules found.
  }

  for (const rule of URL_OBJECT_RULES) {
    const signal = rule(parsed)
    if (signal) signals.push(signal)
  }

  return signals
}

/**
 * Runs all DOM-based rules against collected page features and returns the
 * signals that fired.
 */
export function analyzeDom(features: PageFeatures): RiskSignal[] {
  const signals: RiskSignal[] = []

  for (const rule of DOM_RULES) {
    const signal = rule(features)
    if (signal) signals.push(signal)
  }

  return signals
}