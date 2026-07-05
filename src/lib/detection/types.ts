/**
 * PhishGuard — Detection engine data structures.
 *
 * This file defines the SHAPE of what our URL analysis engine returns.
 * It contains no detection logic yet — only the "contract" that every
 * heuristic rule and the final scorer must follow. Designing this shape
 * first keeps all rules consistent and makes the engine easy to extend.
 */

/**
 * How serious a single detected signal is.
 * We use a small, fixed set of levels instead of raw numbers so the code
 * stays readable and the UI can map each level to a colour later.
 */
export const Severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const

export type Severity = (typeof Severity)[keyof typeof Severity]

/**
 * A machine-readable id for each kind of check we perform.
 * Using an enum-like object (instead of loose strings) prevents typos
 * and gives us autocomplete when we add rules in later steps.
 */
export const SignalId = {
  NO_HTTPS: 'NO_HTTPS',
  IP_ADDRESS_HOST: 'IP_ADDRESS_HOST',
  AT_SYMBOL_IN_URL: 'AT_SYMBOL_IN_URL',
  EXCESSIVE_LENGTH: 'EXCESSIVE_LENGTH',
  MANY_SUBDOMAINS: 'MANY_SUBDOMAINS',
  SUSPICIOUS_TLD: 'SUSPICIOUS_TLD',
  PUNYCODE_HOST: 'PUNYCODE_HOST',
  BRAND_IN_SUBDOMAIN: 'BRAND_IN_SUBDOMAIN',
} as const

export type SignalId = (typeof SignalId)[keyof typeof SignalId]

/**
 * A single suspicious finding produced by one heuristic rule.
 * Every rule that fires returns exactly one RiskSignal in this shape.
 */
export interface RiskSignal {
  /** Which check produced this signal (stable, machine-readable). */
  id: SignalId
  /** How serious this finding is. */
  severity: Severity
  /** Points this signal contributes to the total risk score. */
  score: number
  /** A short, human-readable explanation shown to the user. */
  description: string
}

/**
 * Overall risk classification, derived from the total score.
 * This is what the UI ultimately uses to warn (or reassure) the user.
 */
export const RiskLevel = {
  SAFE: 'SAFE',
  SUSPICIOUS: 'SUSPICIOUS',
  DANGEROUS: 'DANGEROUS',
} as const

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

/**
 * The complete result of analysing one URL.
 * This is the single object the rest of the extension (background, popup)
 * will consume.
 */
export interface UrlAnalysisResult {
  /** The URL that was analysed. */
  url: string
  /** Sum of the scores of all signals that fired. */
  totalScore: number
  /** Human-facing classification derived from totalScore. */
  level: RiskLevel
  /** Every suspicious signal we detected (empty if the URL looks clean). */
  signals: RiskSignal[]
}