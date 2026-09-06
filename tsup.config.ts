import {defineConfig} from 'tsup';

export default defineConfig([
  {
    // The library: plan() and paint() with their types, for anyone who wants
    // the painter without the page.
    entry: {index: 'src/index.ts'},
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    // The Mersenne Twister core ships inside dist, so the package has no runtime dependencies.
    noExternal: ['mersenne-twister'],
  },
  {
    // The demo page's script, built straight into docs/ so GitHub Pages serves
    // it with no build step of its own. Committed; CI fails if it is stale.
    entry: {painterly: 'src/demo/main.ts'},
    outDir: 'docs',
    format: ['iife'],
    minify: true,
    target: 'es2022',
    noExternal: ['mersenne-twister'],
    outExtension: () => ({js: '.js'}),
  },
]);
