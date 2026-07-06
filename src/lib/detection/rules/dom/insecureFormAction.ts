/**
 * DOM Rule: INSECURE_FORM_ACTION
 *
 * Flags pages that submit form data over plain http://, even if the page
 * itself is https. This "mixed content" means submitted data (possibly
 * including a password) leaves over an unencrypted channel.
 */

import { type RiskSignal, Severity, SignalId } from '../../types'
import type { PageFeatures } from '../../types'

export function checkInsecureFormAction(
  features: PageFeatures,
): RiskSignal | null {
  if (!features.hasInsecureFormAction) {
    return null
  }

  // More serious if a password is involved, but insecure submission is a
  // concern either way.
  const severity = features.hasPasswordField ? Severity.HIGH : Severity.MEDIUM
  const score = features.hasPasswordField ? 30 : 15

  return {
    id: SignalId.INSECURE_FORM_ACTION,
    severity,
    score,
    description: 'This page submits form data over an insecure connection.',
  }
}
