/**
 * PhishGuard — User settings and whitelist (persistent).
 *
 * This module is the single source of truth for user-controlled config:
 * whether protection is enabled, and which hosts the user has chosen to
 * trust (the whitelist). It is stored in chrome.storage.local so it
 * survives browser restarts.
 *
 * The rest of the extension NEVER touches chrome.storage directly for
 * settings — it goes through these helpers, so storage keys, defaults,
 * and normalisation all live in one place.
 */

import { normalizeHost } from './detection/blocklist'

/** The shape of all persistent user settings. */
export interface Settings {
  /** Master switch: when false, PhishGuard does not warn at all. */
  enabled: boolean
  /** Hosts the user has explicitly chosen to trust (already normalised). */
  whitelist: string[]
}

/** Safe defaults used the first time, before the user changes anything. */
export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  whitelist: [],
}

/** The single storage key under which all settings live. */
const STORAGE_KEY = 'phishguard:settings'

/**
 * Reads the current settings, falling back to defaults for anything
 * missing. Always returns a complete Settings object.
 */
export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  const raw = stored[STORAGE_KEY] as Partial<Settings> | undefined

  // Merge over defaults so new fields added later still get a value.
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    // Ensure whitelist is always a real array.
    whitelist: Array.isArray(raw?.whitelist) ? raw!.whitelist : [],
  }
}

/** Overwrites the stored settings with the given object. */
export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings })
}

/** Returns true if the given host is on the user's whitelist. */
export async function isWhitelisted(host: string): Promise<boolean> {
  const { whitelist } = await getSettings()
  return whitelist.includes(normalizeHost(host))
}

/**
 * Adds a host to the whitelist (normalised, no duplicates) and saves.
 * Returns the updated settings.
 */
export async function addToWhitelist(host: string): Promise<Settings> {
  const settings = await getSettings()
  const normalized = normalizeHost(host)

  if (!settings.whitelist.includes(normalized)) {
    settings.whitelist = [...settings.whitelist, normalized]
    await saveSettings(settings)
  }

  return settings
}

/**
 * Removes a host from the whitelist and saves.
 * Returns the updated settings.
 */
export async function removeFromWhitelist(host: string): Promise<Settings> {
  const settings = await getSettings()
  const normalized = normalizeHost(host)

  settings.whitelist = settings.whitelist.filter((h) => h !== normalized)
  await saveSettings(settings)

  return settings
}

/** Sets the master enabled switch and saves. Returns updated settings. */
export async function setEnabled(enabled: boolean): Promise<Settings> {
  const settings = await getSettings()
  settings.enabled = enabled
  await saveSettings(settings)
  return settings
}
