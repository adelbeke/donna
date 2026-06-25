import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import pkg from './package.json'

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
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    build: { rollupOptions: { input: 'index.html' } },
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  },
})
