/**
 * Shared message contract for the PhishGuard extension.
 *
 * The three parts of the extension (popup, background service worker, and
 * content script) cannot read each other's variables directly. They only
 * communicate by passing messages. This file defines the exact shape of
 * every message so all parts stay in sync and TypeScript catches mistakes.
 */

import type { PageFeatures, UrlAnalysisResult } from './detection'

/** All message "type" identifiers used across the extension. */
export const MessageType = {
  /** Popup -> Background: ask for the active tab's URL. */
  GET_CURRENT_URL: 'GET_CURRENT_URL',
  /** Content script -> Background: announce it loaded on a page. */
  CONTENT_SCRIPT_LOADED: 'CONTENT_SCRIPT_LOADED',
  /** Content script -> Background: the collected DOM features of a page. */
  PAGE_FEATURES: 'PAGE_FEATURES',
  /** Popup -> Background: ask for the current tab's analysis result. */
  GET_TAB_RESULT: 'GET_TAB_RESULT',
  /** Popup -> Background: add/remove the current host from the whitelist. */
  TOGGLE_WHITELIST: 'TOGGLE_WHITELIST',
  /** Background -> Content script: show an on-page danger warning. */
  SHOW_WARNING: 'SHOW_WARNING',
} as const

export type MessageType = (typeof MessageType)[keyof typeof MessageType]

/* -------------------------------------------------------------------------- */
/*  Request messages (received by the background).                             */
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

/** Popup -> Background: "Give me the current tab's analysis result." */
export interface GetTabResultRequest {
  type: typeof MessageType.GET_TAB_RESULT
}

/** Popup -> Background: "Toggle whitelist status for this host." */
export interface ToggleWhitelistRequest {
  type: typeof MessageType.TOGGLE_WHITELIST
  host: string
}

/** A discriminated union of every request the background can receive. */
export type ExtensionMessage =
  | GetCurrentUrlRequest
  | ContentScriptLoadedRequest
  | PageFeaturesRequest
  | GetTabResultRequest
  | ToggleWhitelistRequest

/* -------------------------------------------------------------------------- */
/*  Messages sent TO the content script.                                       */
/* -------------------------------------------------------------------------- */

/** Background -> Content script: "Show a danger warning banner." */
export interface ShowWarningRequest {
  type: typeof MessageType.SHOW_WARNING
  reason: string
}

/** A union of every message the content script can receive. */
export type ContentMessage = ShowWarningRequest

/* -------------------------------------------------------------------------- */
/*  Response messages.                                                         */
/* -------------------------------------------------------------------------- */

/** Background -> Popup: the answer to GET_CURRENT_URL. */
export interface GetCurrentUrlResponse {
  url: string | null
}

/** Background -> Popup: the answer to GET_TAB_RESULT. */
export interface GetTabResultResponse {
  result: UrlAnalysisResult | null
}

/** Background -> Popup: the answer to TOGGLE_WHITELIST. */
export interface ToggleWhitelistResponse {
  /** True if the host is now whitelisted, false if it was removed. */
  whitelisted: boolean
}
