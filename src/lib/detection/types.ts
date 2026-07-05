/**
 * PhishGuard — Detection engine data structures.
 *
 * This file defines the SHAPE of what our detection engine works with:
 * the signals it produces, the page features it consumes, and the final
 * analysis result. It contains no detection logic — only the "contract"
 * that every rule, collector, and the scorer must follow.
 */

/**
 * How serious a single detected signal is.
 * A small, fixed set of levels keeps the code readable and lets the UI
 * map each level to a colour later.
 */
export const Severity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const

export type Severity = (typeof Severity)[keyof typeof Severity]

/**
 * A machine-readable id for each kind of check we perform.
 * URL-based ids come first, then DOM/page-based ids (added in Milestone 4).
 */
export const SignalId = {
  // --- URL-based signals (Milestone 3) ---
  NO_HTTPS: 'NO_HTTPS',
  IP_ADDRESS_HOST: 'IP_ADDRESS_HOST',
  AT_SYMBOL_IN_URL: 'AT_SYMBOL_IN_URL',
  EXCESSIVE_LENGTH: 'EXCESSIVE_LENGTH',
  MANY_SUBDOMAINS: 'MANY_SUBDOMAINS',
  SUSPICIOUS_TLD: 'SUSPICIOUS_TLD',
  PUNYCODE_HOST: 'PUNYCODE_HOST',
  BRAND_IN_SUBDOMAIN: 'BRAND_IN_SUBDOMAIN',

  // --- DOM/page-based signals (Milestone 4) ---
  PASSWORD_FIELD_PRESENT: 'PASSWORD_FIELD_PRESENT',
  FORM_ACTION_MISMATCH: 'FORM_ACTION_MISMATCH',
  INSECURE_FORM_ACTION: 'INSECURE_FORM_ACTION',
  PASSWORD_FIELD_NO_HTTPS: 'PASSWORD_FIELD_NO_HTTPS',
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
 * Raw, serializable facts collected from a page's DOM by the content
 * script. IMPORTANT: this must only contain primitive values (booleans,
 * numbers, strings, arrays of strings) — never live DOM elements — because
 * it is sent from the content script to the background as a message and
 * must survive JSON serialization.
 *
 * The content script is the "eyes" (it gathers these facts); the background
 * is the "brain" (it judges them). Keeping the facts simple keeps the
 * hostile-page-facing code minimal and safe.
 */
export interface PageFeatures {
  /** The page's own URL (window.location.href). */
  pageUrl: string
  /** The page's <title> text, trimmed. Used for brand-impersonation checks. */
  pageTitle: string
  /** True if the page contains at least one <input type="password">. */
  hasPasswordField: boolean
  /**
   * The distinct hostnames that the page's <form> elements submit to,
   * derived from each form's resolved "action" URL. Empty if there are no
   * forms or no actions. Example: ["evil-collector.example"].
   */
  formActionHosts: string[]
  /**
   * True if any form submits over plain http:// (an insecure action),
   * regardless of whether the page itself is https.
   */
  hasInsecureFormAction: boolean
}

/**
 * The complete result of analysing one page.
 * This single object is what the rest of the extension (background, popup)
 * consumes. It now reflects BOTH url-based and dom-based signals.
 */
export interface UrlAnalysisResult {
  /** The URL that was analysed. */
  url: string
  /** Sum of the scores of all signals that fired. */
  totalScore: number
  /** Human-facing classification derived from totalScore. */
  level: RiskLevel
  /** Every suspicious signal we detected (empty if the page looks clean). */
  signals: RiskSignal[]
}