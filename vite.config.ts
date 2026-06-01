import { defineConfig } from 'vite';

// 相対パス出力（GitHub Pages のリポジトリ名に依存せず、file:// でも動作）
export default defineConfig({
  base: './',
  server: {
    host: true,
  },
});
