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
    // Inlining strips its header, so the bundle points at the notice that replaces it.
    noExternal: ['mersenne-twister'],
    banner: {js: '/* painterly bundles mersenne-twister, BSD-3-Clause \u2014 see NOTICE */'},
  },
  {
    // The demo page's script and its planning worker, built straight into
    // docs/ so GitHub Pages serves them with no build step of its own.
    // Committed; CI fails if they are stale.
    entry: {painterly: 'src/demo/main.ts', planner: 'src/demo/planner.ts'},
    outDir: 'docs',
    format: ['iife'],
    minify: true,
    target: 'es2022',
    noExternal: ['mersenne-twister'],
    banner: {js: '/* painterly bundles mersenne-twister, BSD-3-Clause \u2014 see NOTICE */'},
    outExtension: () => ({js: '.js'}),
  },
]);
