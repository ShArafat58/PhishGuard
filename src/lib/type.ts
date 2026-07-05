/**
 * Shared message contract for the PhishGuard extension.
 *
 * The three parts of the extension (popup, background service worker, and
 * content script) cannot read each other's variables directly. They only
 * communicate by passing messages. This file defines the exact shape of
 * every message so that all parts stay in sync and TypeScript can catch
 * mistakes at compile time.
 */

/**
 * All message "type" identifiers used across the extension.
 * Using a const object (instead of loose strings) gives us autocomplete
 * and prevents typos like 'GET_CURENT_URL'.
 */
export const MessageType = {
  /** Sent by the popup to ask the background for the active tab's URL. */
  GET_CURRENT_URL: 'GET_CURRENT_URL',
  /** Sent by a content script to announce it has loaded on a page. */
  CONTENT_SCRIPT_LOADED: 'CONTENT_SCRIPT_LOADED',
} as const

/**
 * A union of the string literal values above, e.g. 'GET_CURRENT_URL'.
 * `typeof MessageType` is the object's type; the `[keyof ...]` part
 * extracts the value types from it.
 */
export type MessageType = (typeof MessageType)[keyof typeof MessageType]

/* -------------------------------------------------------------------------- */
/*  Request messages: sent from one part, expecting the receiver to act.       */
/* -------------------------------------------------------------------------- */

/** Popup -> Background: "What is the current tab's URL?" */
export interface GetCurrentUrlRequest {
  type: typeof MessageType.GET_CURRENT_URL
}

/** Content script -> Background: "I loaded on this page." */
export interface ContentScriptLoadedRequest {
  type: typeof MessageType.CONTENT_SCRIPT_LOADED
  url: string
}

/**
 * A discriminated union of every request the background can receive.
 * The shared `type` field is the "discriminant": once TypeScript sees
 * its value, it knows exactly which interface it is dealing with.
 */
export type ExtensionMessage =
  | GetCurrentUrlRequest
  | ContentScriptLoadedRequest

/* -------------------------------------------------------------------------- */
/*  Response messages: sent back by the background as a reply.                  */
/* -------------------------------------------------------------------------- */

/** Background -> Popup: the answer to GET_CURRENT_URL. */
export interface GetCurrentUrlResponse {
  /** The active tab's URL, or null if it could not be determined. */
  url: string | null
}