import { defineManifest } from '@crxjs/vite-plugin'

// The manifest is the single source of truth for what our extension is,
// what it can access, and which files act as its entry points.
export default defineManifest({
  manifest_version: 3,
  name: 'PhishGuard',
  version: '0.0.1',
  description:
    'Detects and warns about phishing websites in real time using URL heuristics and page analysis.',

  // Icons shown on the extensions page, install dialog, and store.
  icons: {
    16: 'public/icons/icon16.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },

  action: {
    default_popup: 'src/popup/popup.html',
    // Icon shown on the toolbar button.
    default_icon: {
      16: 'public/icons/icon16.png',
      48: 'public/icons/icon48.png',
      128: 'public/icons/icon128.png',
    },
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],

  options_ui: {
    page: 'src/options/options.html',
    open_in_tab: true,
  },

  // Principle of least privilege: request only what we truly need.
  permissions: ['activeTab', 'storage'],
})