import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { submitOrderApiPlugin } from './vite.submitOrderPlugin'

export default defineConfig({
  plugins: [react(), submitOrderApiPlugin()],
})
