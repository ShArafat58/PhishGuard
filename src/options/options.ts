/**
 * PhishGuard — Options page script.
 *
 * Lets the user toggle protection on/off and view/remove trusted sites
 * (the whitelist). It reads and writes settings directly through the
 * settings helpers, which persist to chrome.storage.local.
 *
 * SECURITY: whitelisted hosts are inserted with textContent (never
 * innerHTML) so a stored value can never inject markup into this page.
 */

import {
  getSettings,
  setEnabled,
  removeFromWhitelist,
} from '../lib/settings'

/** Renders the whitelist entries, each with a Remove button. */
function renderWhitelist(hosts: string[]): void {
  const list = document.getElementById('pg-whitelist')
  const empty = document.getElementById('pg-empty')
  if (!list || !empty) return

  list.replaceChildren()

  if (hosts.length === 0) {
    empty.hidden = false
    return
  }
  empty.hidden = true

  for (const host of hosts) {
    const item = document.createElement('li')
    item.className = 'pg-wl-item'

    const name = document.createElement('span')
    name.className = 'pg-wl-host'
    name.textContent = host // textContent → no injection

    const remove = document.createElement('button')
    remove.className = 'pg-wl-remove'
    remove.textContent = 'Remove'
    remove.addEventListener('click', () => void onRemove(host))

    item.append(name, remove)
    list.appendChild(item)
  }
}

/** Removes a host from the whitelist and re-renders. */
async function onRemove(host: string): Promise<void> {
  const settings = await removeFromWhitelist(host)
  renderWhitelist(settings.whitelist)
}

/** Loads settings and wires up the UI. */
async function init(): Promise<void> {
  const settings = await getSettings()

  // Master switch.
  const toggle = document.getElementById('pg-enabled') as HTMLInputElement | null
  if (toggle) {
    toggle.checked = settings.enabled
    toggle.addEventListener('change', () => {
      void setEnabled(toggle.checked)
    })
  }

  // Whitelist.
  renderWhitelist(settings.whitelist)
}

void init()