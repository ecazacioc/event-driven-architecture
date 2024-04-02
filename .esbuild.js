#!/usr/bin/env node
const esbuild = require('esbuild');

function generateEsbuildLambdaDefaultOptions() {
  return {
    bundle: true,
    sourcemap: true,
    platform: "node",
    outdir: "dist",
    absWorkingDir: process.cwd(),
    target: "node18",
    logLevel: "error",
    keepNames: true,
    minify: true,
  };
}

function esbuildLambda(additionalOptions = {}) {
  const mergedOptions = {
    ...generateEsbuildLambdaDefaultOptions(),
    ...additionalOptions,
  };

  return esbuild.build(mergedOptions);
}

esbuildLambda({
  entryPoints: [
    './src/lambdas/data-update-processor/index.ts',
    './src/lambdas/materialized-view-builder/index.ts',
    './src/lambdas/results-processor/index.ts',
  ],
});
