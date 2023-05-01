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
      '@/api' : path.resolve(__dirname, './src/api'),
      '@/components' : path.resolve(__dirname, './src/components'),
      '@/hooks' : path.resolve(__dirname, './src/hooks'),
    },
  },
})
