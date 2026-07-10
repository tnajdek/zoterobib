#!/usr/bin/env node

import { mkdirSync } from 'fs';

import { runBatch, runInteractive, BOLD, RED, RESET } from './task-runner.mjs';

const PORT = process.env.PORT ?? 8001;

const PREPARE_TASKS = [
	{ label: 'Citeproc', cmd: 'npm', args: ['run', 'build:fetch-citeproc'] },
	{ label: 'Locale', cmd: 'npm', args: ['run', 'build:collect-locale'] },
	{ label: 'Styles JSON', cmd: 'npm', args: ['run', 'build:styles-json'] },
];

const DEV_TASKS = [
	{ label: 'Server', cmd: 'node', args: ['scripts/server.cjs'] },
	{ label: 'JS', cmd: 'npx', args: ['rollup', '-c', '-w'] },
	{ label: 'SCSS', cmd: 'npx', args: ['sass', '--embed-source-map', '--watch', 'src/scss/bib.scss', 'build/static/bib.css'] },
	{ label: 'HTML', cmd: 'npx', args: ['nodemon', '-q', '-w', 'src/html', '-w', 'config', '--ext', '.', '--exec', 'npm run build:html'] },
	{ label: 'Static', cmd: 'npx', args: ['nodemon', '-q', '-w', 'src/static', '--ext', '.', '--exec', 'npm run build:static'] },
];

async function main() {
	mkdirSync('build/static', { recursive: true });

	try {
		await runBatch('Preparing...', PREPARE_TASKS);
	} catch {
		process.stdout.write(`${RED}${BOLD}Prepare step failed. Aborting.${RESET}\n`);
		process.exit(1);
	}

	runInteractive('ZoteroBib', `http://localhost:${PORT}`, DEV_TASKS);
}

main();
