/**
 * Tests for the risk scorer and the full analyze-and-score pipeline.
 * These act as living documentation: they show exactly what verdict each
 * kind of URL should receive, and fail loudly if that ever changes.
 */

import { describe, it, expect } from 'vitest'
import { analyzeAndScore } from '../scorer'
import { RiskLevel } from '../types'

describe('analyzeAndScore', () => {
  it('classifies a clean, well-known site as SAFE', () => {
    const result = analyzeAndScore('https://www.wikipedia.org/')
    expect(result.level).toBe(RiskLevel.SAFE)
    expect(result.totalScore).toBe(0)
    expect(result.signals).toHaveLength(0)
  })

  it('classifies an obvious phishing URL as DANGEROUS', () => {
    const result = analyzeAndScore(
      'http://paypal.com.secure-login.xyz@192.0.2.5/verify',
    )
    expect(result.level).toBe(RiskLevel.DANGEROUS)
    expect(result.totalScore).toBeGreaterThanOrEqual(40)
  })

  it('flags a look-alike subdomain domain as risky', () => {
    const result = analyzeAndScore(
      'https://paypal.com.secure-login.account-verify.xyz/login',
    )
    // Many subdomains + suspicious TLD should fire.
    const ids = result.signals.map((s) => s.id)
    expect(ids).toContain('MANY_SUBDOMAINS')
    expect(ids).toContain('SUSPICIOUS_TLD')
    expect(result.level).not.toBe(RiskLevel.SAFE)
  })

  it('treats a plain http site as at least SUSPICIOUS', () => {
    const result = analyzeAndScore('http://example.com/')
    expect(result.level).not.toBe(RiskLevel.SAFE)
    expect(result.signals.map((s) => s.id)).toContain('NO_HTTPS')
  })

  it('does not crash on a malformed URL', () => {
    const result = analyzeAndScore('not-a-real-url')
    expect(result).toBeDefined()
    expect(Array.isArray(result.signals)).toBe(true)
  })
})