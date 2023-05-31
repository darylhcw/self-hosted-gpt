import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
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
  base: '/self-hosted-gpt/',
})
