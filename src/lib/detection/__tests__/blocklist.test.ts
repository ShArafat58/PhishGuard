/**
 * Tests for the blocklist lookup.
 *
 * These verify that known-phishing hosts are matched, that normalisation
 * works (case + "www." prefix), that unrelated sites are NOT matched, and
 * that malformed URLs are handled safely.
 */

import { describe, it, expect } from 'vitest'
import { isBlocklisted, normalizeHost } from '../blocklist'

describe('normalizeHost', () => {
  it('lower-cases the host', () => {
    expect(normalizeHost('Evil-Collector.Example')).toBe(
      'evil-collector.example',
    )
  })

  it('strips a leading www.', () => {
    expect(normalizeHost('www.evil-collector.example')).toBe(
      'evil-collector.example',
    )
  })
})

describe('isBlocklisted', () => {
  it('matches a known blocklisted host', () => {
    expect(isBlocklisted('https://evil-collector.example/steal')).toBe(true)
  })

  it('matches regardless of case and www. prefix', () => {
    expect(isBlocklisted('https://WWW.Evil-Collector.Example/')).toBe(true)
  })

  it('matches a blocklisted host on any path', () => {
    expect(
      isBlocklisted('http://paypal-security-check.example/login?x=1'),
    ).toBe(true)
  })

  it('does NOT match a legitimate site', () => {
    expect(isBlocklisted('https://github.com/')).toBe(false)
  })

  it('returns false for a malformed URL', () => {
    expect(isBlocklisted('not-a-real-url')).toBe(false)
  })
})
