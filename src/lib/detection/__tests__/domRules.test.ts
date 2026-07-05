/**
 * Tests for the DOM-based detection rules.
 *
 * These rules are pure functions that take a PageFeatures object and return
 * a RiskSignal or null. Because they never touch a real DOM, we can test
 * every attacker scenario with hand-built feature objects — no browser
 * needed. Each test documents one real phishing behaviour.
 */

import { describe, it, expect } from 'vitest'
import type { PageFeatures } from '../types'
import { checkPasswordFieldNoHttps } from '../rules/dom/passwordFieldNoHttps'
import { checkFormActionMismatch } from '../rules/dom/formActionMismatch'
import { checkInsecureFormAction } from '../rules/dom/insecureFormAction'

/**
 * Builds a PageFeatures object with safe defaults, overriding only the
 * fields a given test cares about. This keeps each test short and focused.
 */
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

describe('checkPasswordFieldNoHttps', () => {
  it('fires when a password field is on an http page', () => {
    const signal = checkPasswordFieldNoHttps(
      makeFeatures({ pageUrl: 'http://login.example/', hasPasswordField: true }),
    )
    expect(signal?.id).toBe('PASSWORD_FIELD_NO_HTTPS')
    expect(signal?.severity).toBe('HIGH')
  })

  it('does NOT fire when the password field is on an https page', () => {
    const signal = checkPasswordFieldNoHttps(
      makeFeatures({ pageUrl: 'https://login.example/', hasPasswordField: true }),
    )
    expect(signal).toBeNull()
  })

  it('does NOT fire when there is no password field', () => {
    const signal = checkPasswordFieldNoHttps(
      makeFeatures({ pageUrl: 'http://example.com/' }),
    )
    expect(signal).toBeNull()
  })
})

describe('checkFormActionMismatch', () => {
  it('fires when a login form posts to a different host', () => {
    const signal = checkFormActionMismatch(
      makeFeatures({
        pageUrl: 'https://bank.example/login',
        hasPasswordField: true,
        formActionHosts: ['evil-collector.example'],
      }),
    )
    expect(signal?.id).toBe('FORM_ACTION_MISMATCH')
    expect(signal?.severity).toBe('HIGH')
  })

  it('does NOT fire when the form posts to the same host', () => {
    const signal = checkFormActionMismatch(
      makeFeatures({
        pageUrl: 'https://bank.example/login',
        hasPasswordField: true,
        formActionHosts: ['bank.example'],
      }),
    )
    expect(signal).toBeNull()
  })

  it('does NOT fire when there is no password field (avoids false positives)', () => {
    const signal = checkFormActionMismatch(
      makeFeatures({
        pageUrl: 'https://blog.example/',
        hasPasswordField: false,
        formActionHosts: ['newsletter-service.example'],
      }),
    )
    expect(signal).toBeNull()
  })
})

describe('checkInsecureFormAction', () => {
  it('fires with HIGH severity when a password form submits over http', () => {
    const signal = checkInsecureFormAction(
      makeFeatures({ hasPasswordField: true, hasInsecureFormAction: true }),
    )
    expect(signal?.id).toBe('INSECURE_FORM_ACTION')
    expect(signal?.severity).toBe('HIGH')
  })

  it('fires with MEDIUM severity when a non-password form submits over http', () => {
    const signal = checkInsecureFormAction(
      makeFeatures({ hasPasswordField: false, hasInsecureFormAction: true }),
    )
    expect(signal?.severity).toBe('MEDIUM')
  })

  it('does NOT fire when all form actions are secure', () => {
    const signal = checkInsecureFormAction(
      makeFeatures({ hasInsecureFormAction: false }),
    )
    expect(signal).toBeNull()
  })
})