import { defineManifest } from '@crxjs/vite-plugin'

// The manifest is the single source of truth for what our extension is,
// what it can access, and which files act as its entry points.
export default defineManifest({
  manifest_version: 3,
  name: 'PhishGuard',
  version: '0.0.1',
  description:
    'Detects and warns about phishing websites in real time using URL heuristics and page analysis.',

  // The popup shown when the user clicks the toolbar icon.
  action: {
    default_popup: 'src/popup/popup.html',
  },

  // The service worker: our extension's central "brain".
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  // Scripts injected into every web page the user visits.
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],

  // Principle of least privilege: request only what we truly need.
  permissions: ['activeTab', 'storage'],
})