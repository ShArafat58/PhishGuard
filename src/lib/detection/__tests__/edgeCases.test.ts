/**
 * Edge-case and robustness tests for the detection pipeline.
 *
 * These deliberately feed unusual, malformed, or boundary inputs to prove
 * the engine never crashes and always returns a well-formed result. A
 * security tool that silently throws on odd input is dangerous, because
 * the user is then left unprotected without knowing it.
 */

import { describe, it, expect } from 'vitest'
import { analyzeAndScore, analyzePage } from '../scorer'
import { RiskLevel, type PageFeatures } from '../types'

/** Builds PageFeatures with safe defaults, overriding only what a test needs. */
function makeFeatures(overrides: Partial<PageFeatures> = {}): PageFeatures {
  return {
    pageUrl: 'https://example.com/',
    pageTitle: 'Example',
    hasPasswordField: false,
    formActionHosts: [],
    hasInsecureFormAction: false,
    ...overrides,
  }
}

describe('URL analysis — malformed and empty input', () => {
  const badInputs = [
    '',
    '   ',
    'http://',
    '://nohost',
    'not a url',
    'ht!tp://x',
  ]

  for (const input of badInputs) {
    it(`does not crash on: "${input}"`, () => {
      // The key guarantee: it returns a well-formed result, never throws.
      const result = analyzeAndScore(input)
      expect(result).toBeDefined()
      expect(Array.isArray(result.signals)).toBe(true)
      expect(typeof result.totalScore).toBe('number')
      expect(Object.values(RiskLevel)).toContain(result.level)
    })
  }
})

describe('URL analysis — unusual but valid URLs', () => {
  it('does not over-flag a normal site with a port', () => {
    const result = analyzeAndScore('https://example.com:8443/dashboard')
    expect(result.level).toBe(RiskLevel.SAFE)
  })

  it('treats a plain https root domain as SAFE', () => {
    const result = analyzeAndScore('https://openai.com/')
    expect(result.level).toBe(RiskLevel.SAFE)
    expect(result.signals).toHaveLength(0)
  })
})

describe('Score boundaries', () => {
  it('a clean URL scores 0 and is SAFE', () => {
    const result = analyzeAndScore('https://wikipedia.org/')
    expect(result.totalScore).toBe(0)
    expect(result.level).toBe(RiskLevel.SAFE)
  })

  it('any single fired signal makes a site at least SUSPICIOUS', () => {
    // http:// alone fires NO_HTTPS.
    const result = analyzeAndScore('http://plain-http-site.example/')
    expect(result.totalScore).toBeGreaterThan(0)
    expect(result.level).not.toBe(RiskLevel.SAFE)
  })
})

describe('Page analysis — edge cases', () => {
  it('handles a page with an empty URL without crashing', () => {
    const result = analyzePage(makeFeatures({ pageUrl: '' }))
    expect(result).toBeDefined()
    expect(Array.isArray(result.signals)).toBe(true)
  })

  it('handles many form action hosts without crashing', () => {
    const manyHosts = Array.from({ length: 50 }, (_, i) => `host${i}.example`)
    const result = analyzePage(
      makeFeatures({
        pageUrl: 'https://bank.example/login',
        hasPasswordField: true,
        formActionHosts: manyHosts,
      }),
    )
    // A password form posting to foreign hosts should be flagged.
    expect(result.level).not.toBe(RiskLevel.SAFE)
  })

  it('does not flag a normal https page with no forms', () => {
    const result = analyzePage(
      makeFeatures({ pageUrl: 'https://blog.example/article' }),
    )
    expect(result.level).toBe(RiskLevel.SAFE)
  })
})
