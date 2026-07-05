/**
 * PhishGuard — Detection module public API.
 *
 * The rest of the extension imports ONLY from here.
 */

export { analyzeAndScore, analyzePage, SCORE_THRESHOLDS } from './scorer'
export { collectPageFeatures } from './collectPageFeatures'
export type {
  RiskSignal,
  UrlAnalysisResult,
  PageFeatures,
} from './types'
export { RiskLevel, Severity, SignalId } from './types'