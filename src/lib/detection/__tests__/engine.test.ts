/**
 * Tests for individual detection behaviours via the engine.
 * Each test documents one attacker technique and proves we catch it.
 */

import { describe, it, expect } from 'vitest'
import { analyzeUrl } from '../engine'

/** Helper: collect just the signal ids for a URL. */
function idsFor(url: string): string[] {
  return analyzeUrl(url).map((signal) => signal.id)
}

describe('analyzeUrl — individual rules', () => {
  it('detects a raw IP address host', () => {
    expect(idsFor('http://203.0.113.5/login')).toContain('IP_ADDRESS_HOST')
  })

  it('detects the "@" deception trick', () => {
    expect(idsFor('https://google.com@evil.example/')).toContain(
      'AT_SYMBOL_IN_URL',
    )
  })

  it('detects a punycode (homograph) host', () => {
    expect(idsFor('https://xn--pple-43d.com/')).toContain('PUNYCODE_HOST')
  })

  it('detects a suspicious TLD', () => {
    expect(idsFor('https://free-prize.tk/')).toContain('SUSPICIOUS_TLD')
  })

  it('produces no signals for a clean https domain', () => {
    expect(idsFor('https://github.com/')).toHaveLength(0)
  })
})