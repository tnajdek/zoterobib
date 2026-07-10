#!/usr/bin/env node

import { mkdirSync } from 'fs';

import { runBatch, runSingle, BOLD, GREEN, RED, RESET } from './task-runner.mjs';

const NODE_ENV = process.env.NODE_ENV || 'production';

const PREPARE_TASKS = [
	{ label: 'Messages', cmd: 'npm', args: ['run', 'build:messages'] },
	{ label: 'Citeproc', cmd: 'npm', args: ['run', 'build:fetch-citeproc'] },
	{ label: 'Locale', cmd: 'npm', args: ['run', 'build:collect-locale'] },
	{ label: 'Styles JSON', cmd: 'npm', args: ['run', 'build:styles-json'] },
];

const BUILD_TASKS = [
	{ label: 'JS', cmd: 'npx', args: ['rollup', '-c'], env: { NODE_ENV } },
	{ label: 'SCSS', cmd: 'bash', args: ['-c', "for f in src/scss/*.scss; do sass --no-source-map $f build/static/`basename $f .scss`.css; done"], env: { NODE_ENV } },
	{ label: 'HTML', cmd: 'node', args: ['scripts/build-html.cjs'], env: { NODE_ENV } },
	{ label: 'Static', cmd: 'bash', args: ['-c', 'mkdir -p build/static && rsync -vazL src/static/* build/static/'], env: { NODE_ENV } },
];

async function main() {
	const start = Date.now();
	mkdirSync('build/static', { recursive: true });

	try {
		await runBatch('Preparing...', PREPARE_TASKS);
		await runBatch(`Building (${NODE_ENV})...`, BUILD_TASKS);
		await runSingle('Postprocess (autoprefixer, cssnano)', 'npx', ['postcss', 'build/static/bib.css', '--use', 'autoprefixer', '--use', 'cssnano', '--no-map', '-r'], { NODE_ENV });
	} catch (err) {
		process.stdout.write(`${RED}${BOLD}Build failed: ${err.message}${RESET}\n`);
		process.exit(1);
	}

	const elapsed = ((Date.now() - start) / 1000).toFixed(1);
	process.stdout.write(`\n${GREEN}${BOLD}Build complete${RESET} ${elapsed}s\n`);
}

main();
