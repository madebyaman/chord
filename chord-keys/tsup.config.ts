import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'chord-keys': 'src/index.ts',
  },
  outDir: 'dist',
  sourcemap: false,
  minify: true,
  dts: true,
  format: ['esm', 'cjs'],
  loader: {
    '.js': 'jsx',
  },
  // Exclude test files from compilation
  exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
  // Extract CSS to separate file instead of injecting into JS
  injectStyle: false,
})
