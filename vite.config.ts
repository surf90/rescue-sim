import { defineConfig } from 'vite';

// GitHub Pages 用 base パス（リポジトリ名: rescue-sim）
export default defineConfig({
  base: '/rescue-sim/',
  server: {
    host: true,
  },
});
