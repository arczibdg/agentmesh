import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
  },
  {
    entry: ['src/runtime/worker-entry.ts'],
    format: ['esm'],
    outDir: 'dist/runtime',
    dts: false,
    clean: false,
  },
]);
