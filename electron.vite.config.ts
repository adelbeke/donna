import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: { rollupOptions: { input: { index: './electron/main.ts' }, external: ['electron'] } },
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: './electron/preload.ts' },
        external: ['electron'],
        output: { format: 'cjs', entryFileNames: '[name].js' },
      },
    },
  },
  renderer: {
    root: '.',
    plugins: [react(), tailwindcss()],
    build: { rollupOptions: { input: 'index.html' } },
  },
})
