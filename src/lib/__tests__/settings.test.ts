/**
 * Tests for user settings and the whitelist (settings.ts).
 *
 * These are security-critical: the whitelist decides which sites bypass
 * all warnings, so its behaviour must be correct and predictable. We run
 * them against a fake chrome.storage (see chromeMock.ts) so no browser is
 * needed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createChromeMock } from '../../test/chromeMock'

// Install the mock as a global `chrome` BEFORE importing settings.ts,
// because settings.ts references chrome at call time.
const chromeMock = createChromeMock()
vi.stubGlobal('chrome', chromeMock)

// Imported after the stub so the module sees our fake chrome.
import {
  getSettings,
  saveSettings,
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  setEnabled,
  DEFAULT_SETTINGS,
} from '../settings'

describe('settings & whitelist', () => {
  // Start each test from a clean, empty storage.
  beforeEach(() => {
    chromeMock.storage.local._reset()
  })

  it('returns defaults when nothing is stored', async () => {
    const settings = await getSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
    expect(settings.enabled).toBe(true)
    expect(settings.whitelist).toEqual([])
  })

  it('persists and reads back settings', async () => {
    await saveSettings({ enabled: false, whitelist: ['example.com'] })
    const settings = await getSettings()
    expect(settings.enabled).toBe(false)
    expect(settings.whitelist).toEqual(['example.com'])
  })

  it('adds a host to the whitelist (normalised)', async () => {
    await addToWhitelist('WWW.Example.COM')
    expect(await isWhitelisted('example.com')).toBe(true)
    // Normalisation means case and www. do not matter on lookup either.
    expect(await isWhitelisted('www.EXAMPLE.com')).toBe(true)
  })

  it('does not add duplicate hosts', async () => {
    await addToWhitelist('example.com')
    await addToWhitelist('example.com')
    const { whitelist } = await getSettings()
    expect(whitelist).toEqual(['example.com'])
  })

  it('removes a host from the whitelist', async () => {
    await addToWhitelist('example.com')
    await removeFromWhitelist('example.com')
    expect(await isWhitelisted('example.com')).toBe(false)
  })

  it('reports non-whitelisted hosts as false', async () => {
    await addToWhitelist('example.com')
    expect(await isWhitelisted('github.com')).toBe(false)
  })

  it('toggles the enabled flag', async () => {
    await setEnabled(false)
    expect((await getSettings()).enabled).toBe(false)
    await setEnabled(true)
    expect((await getSettings()).enabled).toBe(true)
  })

  it('recovers safely from a corrupt whitelist value', async () => {
    // Simulate corrupt storage where whitelist is not an array.
    await saveSettings({
      enabled: true,
      whitelist: 'oops' as unknown as string[],
    })
    const settings = await getSettings()
    // getSettings must defensively coerce this back to an array.
    expect(Array.isArray(settings.whitelist)).toBe(true)
    expect(settings.whitelist).toEqual([])
  })
})
