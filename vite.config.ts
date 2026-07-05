import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

// CRXJS reads our manifest and configures Vite to build a valid
// Manifest V3 extension into the dist/ folder.
export default defineConfig({
  plugins: [crx({ manifest })],
})