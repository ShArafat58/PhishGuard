/**
 * PhishGuard — Page feature collector ("the eyes").
 *
 * Runs inside a web page (via the content script) and extracts a small,
 * fixed set of SERIALIZABLE facts about the page into a PageFeatures object.
 *
 * Design rules for this file:
 *  - Only read the DOM; never modify it.
 *  - Only produce primitive values (booleans, numbers, strings) — never
 *    return live DOM elements, since these facts are sent to the background
 *    as a message and must survive JSON serialization.
 *  - Be defensive: the page may be hostile or malformed, so wrap risky
 *    parsing (like URL resolution) in try/catch and never throw.
 */

import type { PageFeatures } from './types'

/**
 * Resolves a form's "action" attribute against the page URL and returns
 * its hostname, or null if it cannot be resolved.
 *
 * A form with no action submits to the current page, so we treat an empty
 * action as "same host" by returning the page's own hostname.
 */
function resolveFormActionHost(
  action: string,
  baseUrl: string,
): string | null {
  try {
    // The second argument makes relative actions resolve against the page.
    const resolved = new URL(action || baseUrl, baseUrl)
    return resolved.hostname
  } catch {
    return null
  }
}

/**
 * Returns true if the given resolved action URL uses insecure http://.
 */
function isInsecureAction(action: string, baseUrl: string): boolean {
  try {
    const resolved = new URL(action || baseUrl, baseUrl)
    return resolved.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Reads the current page and returns a PageFeatures snapshot.
 * This is the single entry point the content script calls.
 */
export function collectPageFeatures(): PageFeatures {
  const pageUrl = window.location.href
  const pageTitle = (document.title || '').trim()

  // 1) Does the page ask for a password anywhere?
  const hasPasswordField =
    document.querySelector('input[type="password"]') !== null

  // 2) Where do the page's forms submit to?
  const forms = Array.from(document.querySelectorAll('form'))
  const actionHostSet = new Set<string>()
  let hasInsecureFormAction = false

  for (const form of forms) {
    // We read the raw attribute (not form.action) so an empty/relative
    // action is handled explicitly by our resolver.
    const rawAction = form.getAttribute('action') ?? ''

    const host = resolveFormActionHost(rawAction, pageUrl)
    if (host) {
      actionHostSet.add(host)
    }

    if (isInsecureAction(rawAction, pageUrl)) {
      hasInsecureFormAction = true
    }
  }

  return {
    pageUrl,
    pageTitle,
    hasPasswordField,
    formActionHosts: Array.from(actionHostSet),
    hasInsecureFormAction,
  }
}