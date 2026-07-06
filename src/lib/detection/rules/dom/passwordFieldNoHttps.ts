/**
 * DOM Rule: PASSWORD_FIELD_NO_HTTPS
 *
 * Flags pages that ask for a password but are NOT served over HTTPS.
 * Entering credentials on an http:// page means they travel unencrypted
 * and can be intercepted. This is one of the strongest, clearest signals
 * of an unsafe login page.
 */

import { type RiskSignal, Severity, SignalId } from '../../types'
import type { PageFeatures } from '../../types'

export function checkPasswordFieldNoHttps(
  features: PageFeatures,
): RiskSignal | null {
  if (!features.hasPasswordField) {
    return null
  }

  let isHttps: boolean
  try {
    isHttps = new URL(features.pageUrl).protocol === 'https:'
  } catch {
    isHttps = false // Unparseable URL → treat as not secure.
  }

  if (isHttps) {
    return null // Password field on an https page — fine on its own.
  }

  return {
    id: SignalId.PASSWORD_FIELD_NO_HTTPS,
    severity: Severity.HIGH,
    score: 35,
    description:
      'This page asks for a password but is not on a secure HTTPS connection.',
  }
}