/**
 * PhishGuard — Risk scorer.
 *
 * Turns raw signals (from both URL and DOM analysis) into a single verdict:
 * a total score plus a human-facing RiskLevel.
 */

import { analyzeUrl, analyzeDom } from './engine'
import {
  type RiskSignal,
  type UrlAnalysisResult,
  type PageFeatures,
  RiskLevel,
} from './types'

/**
 * Score thresholds that map a numeric total to a RiskLevel.
 *   - 0            -> SAFE
 *   - 1 .. 39      -> SUSPICIOUS
 *   - 40 and above -> DANGEROUS
 */
export const SCORE_THRESHOLDS = {
  SUSPICIOUS_MIN: 1,
  DANGEROUS_MIN: 40,
} as const

/** Sums the scores of all fired signals. */
function sumScores(signals: RiskSignal[]): number {
  return signals.reduce((total, signal) => total + signal.score, 0)
}

/** Maps a total score to a human-facing risk level. */
function scoreToLevel(totalScore: number): RiskLevel {
  if (totalScore >= SCORE_THRESHOLDS.DANGEROUS_MIN) {
    return RiskLevel.DANGEROUS
  }
  if (totalScore >= SCORE_THRESHOLDS.SUSPICIOUS_MIN) {
    return RiskLevel.SUSPICIOUS
  }
  return RiskLevel.SAFE
}

/** Builds the final result object from a URL and a list of signals. */
function buildResult(url: string, signals: RiskSignal[]): UrlAnalysisResult {
  const totalScore = sumScores(signals)
  return {
    url,
    totalScore,
    level: scoreToLevel(totalScore),
    signals,
  }
}

/**
 * Analyses a URL only (no page features). Kept for URL-only contexts and
 * for the existing test suite.
 */
export function analyzeAndScore(rawUrl: string): UrlAnalysisResult {
  return buildResult(rawUrl, analyzeUrl(rawUrl))
}

/**
 * Full page analysis: combines URL-based and DOM-based signals into one
 * result. This is the main function the background uses for a live page.
 */
export function analyzePage(features: PageFeatures): UrlAnalysisResult {
  const urlSignals = analyzeUrl(features.pageUrl)
  const domSignals = analyzeDom(features)
  return buildResult(features.pageUrl, [...urlSignals, ...domSignals])
}