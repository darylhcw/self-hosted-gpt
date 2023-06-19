import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer'

import path from 'path';


export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve:{
    alias:{
      '@' : path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer({}) // add options if needed
      ],
    }
  },
  base: '/self-hosted-gpt/',
})
