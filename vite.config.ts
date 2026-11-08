import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { submitOrderApiPlugin } from './vite.submitOrderPlugin'

const INTERNAL_ASSETS = 'assets/internal'

export default defineConfig({
  plugins: [react(), submitOrderApiPlugin()],
  build: {
    rollupOptions: {
      // Two apps from one codebase: internal (/) and agency (/agency/).
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        agency: fileURLToPath(new URL('./agency/index.html', import.meta.url)),
      },
      output: {
        // src/internal is only imported by the internal entry, so it lands in
        // that entry's chunk under assets/internal/, which the gate refuses to
        // serve to agency users. scripts/check-agency-bundle.mjs verifies it.
        entryFileNames: (chunk) =>
          chunk.name === 'main'
            ? `${INTERNAL_ASSETS}/[name]-[hash].js`
            : 'assets/[name]-[hash].js',
      },
    },
  },
})
