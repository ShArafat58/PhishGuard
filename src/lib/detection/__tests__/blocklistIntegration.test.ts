/**
 * Integration tests for blocklist detection.
 *
 * Unlike blocklist.test.ts (which tests the lookup in isolation), these
 * tests run a URL through the FULL pipeline — engine + scorer — to prove
 * that a blocklisted host produces the right signal and, on its own,
 * pushes the page to a DANGEROUS verdict.
 */

import { describe, it, expect } from 'vitest'
import { analyzeAndScore } from '../scorer'
import { RiskLevel, SignalId } from '../types'

describe('blocklist integration', () => {
  it('classifies a blocklisted host as DANGEROUS on its own', () => {
    const result = analyzeAndScore('https://evil-collector.example/')

    // The blocklist signal must be present.
    const ids = result.signals.map((s) => s.id)
    expect(ids).toContain(SignalId.BLOCKLISTED_HOST)

    // A blocklist match alone should cross the DANGEROUS threshold.
    expect(result.totalScore).toBeGreaterThanOrEqual(40)
    expect(result.level).toBe(RiskLevel.DANGEROUS)
  })

  it('matches a blocklisted host regardless of path or query', () => {
    const result = analyzeAndScore(
      'https://paypal-security-check.example/login?ref=email',
    )
    const ids = result.signals.map((s) => s.id)
    expect(ids).toContain(SignalId.BLOCKLISTED_HOST)
    expect(result.level).toBe(RiskLevel.DANGEROUS)
  })

  it('does NOT add a blocklist signal for a legitimate site', () => {
    const result = analyzeAndScore('https://github.com/')
    const ids = result.signals.map((s) => s.id)
    expect(ids).not.toContain(SignalId.BLOCKLISTED_HOST)
  })

  it('combines heuristic and blocklist signals on the same URL', () => {
    // http:// (heuristic: NO_HTTPS) + blocklisted host (reputation).
    const result = analyzeAndScore('http://fake-bank-login.example/verify')
    const ids = result.signals.map((s) => s.id)
    expect(ids).toContain(SignalId.BLOCKLISTED_HOST)
    expect(ids).toContain(SignalId.NO_HTTPS)
    // Two layers stacking → clearly DANGEROUS.
    expect(result.level).toBe(RiskLevel.DANGEROUS)
  })
})
