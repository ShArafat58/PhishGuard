/**
 * DOM Rule: FORM_ACTION_MISMATCH
 *
 * Flags pages where a form submits to a DIFFERENT host than the page it
 * lives on. A legitimate login form on bank.com almost always submits to
 * bank.com. A form that quietly posts your password to another domain is
 * a classic credential-harvesting technique.
 *
 * We are conservative: we only raise this when the page ALSO has a
 * password field, because many harmless sites (search boxes, embedded
 * widgets, payment redirects) legitimately post to other hosts.
 */

import { type RiskSignal, Severity, SignalId } from '../../types'
import type { PageFeatures } from '../../types'

export function checkFormActionMismatch(
  features: PageFeatures,
): RiskSignal | null {
  // Only meaningful when credentials are being requested.
  if (!features.hasPasswordField) {
    return null
  }

  let pageHost: string
  try {
    pageHost = new URL(features.pageUrl).hostname
  } catch {
    return null // Cannot determine the page host — skip this rule.
  }

  // Does any form submit to a host that is not the page's own host?
  const foreignHost = features.formActionHosts.find(
    (host) => host && host !== pageHost,
  )

  if (!foreignHost) {
    return null // All forms submit to the same host — fine.
  }

  return {
    id: SignalId.FORM_ACTION_MISMATCH,
    severity: Severity.HIGH,
    score: 40,
    description: `A login form on this page sends data to a different site (${foreignHost}).`,
  }
}
