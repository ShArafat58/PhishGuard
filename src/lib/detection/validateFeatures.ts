/**
 * PhishGuard — Runtime validation for PageFeatures.
 *
 * PageFeatures arrive from a content script that runs inside a
 * potentially hostile page. Even though we already verify the message
 * sender is our own extension, we defensively validate the SHAPE of the
 * data before analysing it. TypeScript types vanish at runtime, so this
 * guard enforces the contract when it actually matters.
 */

import type { PageFeatures } from './types'

/** Returns a safe PageFeatures object, coercing anything malformed. */
export function sanitizeFeatures(input: unknown): PageFeatures {
  const raw = (input ?? {}) as Partial<Record<keyof PageFeatures, unknown>>

  return {
    pageUrl: typeof raw.pageUrl === 'string' ? raw.pageUrl : '',
    pageTitle: typeof raw.pageTitle === 'string' ? raw.pageTitle : '',
    hasPasswordField: raw.hasPasswordField === true,
    formActionHosts: Array.isArray(raw.formActionHosts)
      ? raw.formActionHosts.filter((h): h is string => typeof h === 'string')
      : [],
    hasInsecureFormAction: raw.hasInsecureFormAction === true,
  }
}
