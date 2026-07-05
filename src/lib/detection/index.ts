/**
 * PhishGuard — Detection module public API.
 *
 * The rest of the extension imports ONLY from here, so the internal file
 * structure can change freely without breaking anything outside.
 */

export { analyzeAndScore } from './scorer'
export { SCORE_THRESHOLDS } from './scorer'
export type {
  RiskSignal,
  UrlAnalysisResult,
} from './types'
export { RiskLevel, Severity, SignalId } from './types'