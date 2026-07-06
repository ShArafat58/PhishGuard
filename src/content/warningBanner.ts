/**
 * PhishGuard — On-page warning banner.
 *
 * Injects a highly visible danger banner at the top of a page when the
 * background classifies it as DANGEROUS.
 *
 * The banner is rendered inside a CLOSED Shadow DOM so that:
 *   - the page's CSS cannot hide, restyle, or break our warning, and
 *   - our CSS cannot leak out and affect the page.
 * This keeps the warning reliable even on a hostile page.
 */

/** A unique id so we never inject the banner twice on the same page. */
const HOST_ID = 'phishguard-warning-host'

/**
 * Shows the warning banner with the given reason. Safe to call multiple
 * times — it will not create duplicates.
 */
export function showWarningBanner(reason: string): void {
  // Avoid duplicate banners if features are reported more than once.
  if (document.getElementById(HOST_ID)) return

  // 1) A host element that lives in the page but isolates our content.
  const host = document.createElement('div')
  host.id = HOST_ID

  // 2) A closed shadow root: the page cannot reach inside it.
  const shadow = host.attachShadow({ mode: 'closed' })

  // 3) Scoped styles that live ONLY inside the shadow root.
  const style = document.createElement('style')
  style.textContent = `
    .pg-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647; /* max z-index so nothing covers it */
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #dc2626;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    .pg-icon { font-size: 18px; }
    .pg-text { flex: 1; }
    .pg-text strong { font-weight: 700; }
    .pg-dismiss {
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
    }
    .pg-dismiss:hover { background: rgba(255, 255, 255, 0.3); }
  `

  // 4) Build the banner structure with DOM APIs (never innerHTML with
  //    page-derived text), then set text via textContent to avoid XSS.
  const banner = document.createElement('div')
  banner.className = 'pg-banner'

  const icon = document.createElement('span')
  icon.className = 'pg-icon'
  icon.textContent = '⚠️'

  const text = document.createElement('span')
  text.className = 'pg-text'
  const strong = document.createElement('strong')
  strong.textContent = 'PhishGuard warning: '
  const reasonText = document.createTextNode(
    `This site shows signs of phishing. ${reason} Do not enter passwords or personal information.`,
  )
  text.append(strong, reasonText)

  const dismiss = document.createElement('button')
  dismiss.className = 'pg-dismiss'
  dismiss.textContent = 'Dismiss'
  dismiss.addEventListener('click', () => host.remove())

  banner.append(icon, text, dismiss)
  shadow.append(style, banner)

  // 5) Attach to the page.
  document.documentElement.appendChild(host)
}