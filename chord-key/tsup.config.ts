import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', '!src/**/__tests__/**', '!src/**/*.test.*'],
  outDir: 'dist',
  sourcemap: false,
  minify: true,
  dts: true,
  format: ['esm', 'cjs'],
  loader: {
    '.js': 'jsx',
  },
  injectStyle: false,
})
