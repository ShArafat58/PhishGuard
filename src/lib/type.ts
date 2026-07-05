/**
 * Shared message contract for the PhishGuard extension.
 *
 * The three parts of the extension (popup, background service worker, and
 * content script) cannot read each other's variables directly. They only
 * communicate by passing messages. This file defines the exact shape of
 * every message so that all parts stay in sync and TypeScript can catch
 * mistakes at compile time.
 */

import type { PageFeatures } from './detection/types'

/**
 * All message "type" identifiers used across the extension.
 */
export const MessageType = {
  /** Sent by the popup to ask the background for the active tab's URL. */
  GET_CURRENT_URL: 'GET_CURRENT_URL',
  /** Sent by a content script to announce it has loaded on a page. */
  CONTENT_SCRIPT_LOADED: 'CONTENT_SCRIPT_LOADED',
  /** Sent by a content script with the collected DOM features of a page. */
  PAGE_FEATURES: 'PAGE_FEATURES',
} as const

export type MessageType = (typeof MessageType)[keyof typeof MessageType]

/* -------------------------------------------------------------------------- */
/*  Request messages.                                                          */
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

/** Content script -> Background: "Here are the DOM features of this page." */
export interface PageFeaturesRequest {
  type: typeof MessageType.PAGE_FEATURES
  features: PageFeatures
}

/**
 * A discriminated union of every request the background can receive.
 */
export type ExtensionMessage =
  | GetCurrentUrlRequest
  | ContentScriptLoadedRequest
  | PageFeaturesRequest

/* -------------------------------------------------------------------------- */
/*  Response messages.                                                         */
/* -------------------------------------------------------------------------- */

/** Background -> Popup: the answer to GET_CURRENT_URL. */
export interface GetCurrentUrlResponse {
  /** The active tab's URL, or null if it could not be determined. */
  url: string | null
}