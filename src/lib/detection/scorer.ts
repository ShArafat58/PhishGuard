/**
 * PhishGuard — Risk scorer.
 *
 * Turns the raw list of signals from the engine into a single, meaningful
 * verdict: a total score plus a human-facing RiskLevel. This is what the
 * UI ultimately shows the user.
 */

import { analyzeUrl } from './engine'
import {
  type RiskSignal,
  type UrlAnalysisResult,
  RiskLevel,
} from './types'

/**
 * Score thresholds that map a numeric total to a RiskLevel.
 * Kept in one place so they are easy to understand and tune.
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

/**
 * Analyses a URL end-to-end: runs all rules, sums the scores, and
 * classifies the result. This is the main function the rest of the
 * extension will call.
 */
export function analyzeAndScore(rawUrl: string): UrlAnalysisResult {
  const signals = analyzeUrl(rawUrl)
  const totalScore = sumScores(signals)
  const level = scoreToLevel(totalScore)

  return {
    url: rawUrl,
    totalScore,
    level,
    signals,
  }
}