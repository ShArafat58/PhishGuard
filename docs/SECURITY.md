# Security Policy & Threat Model

PhishGuard is a security tool, so it is designed to be secure itself. This
document records its threat model and the mitigations in place.

## Trust boundaries

The extension has three components with different privilege levels:

- **Content script** — runs inside every web page, which may be hostile.
  Lowest trust. It only reads the DOM and reports primitive facts.
- **Background service worker** — the privileged "brain". It analyses data
  and controls badges and warnings.
- **Popup / Options** — user-facing UI with extension privileges.

## Threats & mitigations

| ID  | Threat                                                                   | Mitigation                                                                                                                               |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | A hostile page feeds malformed data to the content script                | The content script only reads the DOM and produces primitive values; the background additionally sanitises incoming features at runtime. |
| T2  | Another extension sends forged messages to the background                | The background rejects any message whose `sender.id` is not this extension's own id.                                                     |
| T3  | Page-derived text (URL, host, title) triggers XSS in the popup or banner | All such text is inserted with `textContent` / `createTextNode`, never `innerHTML`.                                                      |
| T4  | A hostile page hides or restyles the warning banner                      | The banner is rendered in a closed Shadow DOM with the maximum z-index, isolated from page CSS and scripts.                              |
| T5  | The extension requests excessive permissions                             | Only `activeTab` and `storage` are requested (principle of least privilege).                                                             |
| T6  | Corrupt or malicious storage bypasses protection                         | `getSettings` defensively coerces malformed values back to safe defaults; covered by automated tests.                                    |

## Privacy

- Blocklist matching is performed entirely offline against a bundled list.
  The user's browsing URLs are never sent to any server.
- Per-tab results are stored in `chrome.storage.session` (cleared when the
  browser closes) and never written to disk.

## Known limitations

- Heuristic detection can produce false positives and false negatives; it
  is one layer of defence, not a guarantee.
- The whitelist is a user override: trusting a site disables warnings for
  it, so users must apply it carefully.
- Feature collection is a one-time snapshot on page load; content added
  later by JavaScript (e.g. in single-page apps) may be missed.

## Reporting

This is an educational project. To report a security concern, please open
an issue on the GitHub repository.
