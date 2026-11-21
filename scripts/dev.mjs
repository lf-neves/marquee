#!/usr/bin/env node
// `pnpm dev`: one command from a fresh clone to a running app.
//
// - Creates .env from .env.example when it is missing.
// - Without a TMDB token, serves the recorded fixture catalog, so no keys are needed.
// - With Docker running, starts Postgres and applies migrations; without it, the watchlist is
//   switched off and everything else works.
// - Starts the Next.js dev server.
//
// Overrides go through the child's environment: Next.js loads .env with process.loadEnvFile, which
// never replaces a variable that is already set, so an empty value switches a feature off.

import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const envPath = path.join(root, '.env');
const port = process.env.PORT ?? '3000';

const step = (message) => process.stdout.write(`\u001b[33m▸\u001b[0m ${message}\n`);
const run = (command, args) =>
  spawnSync(command, args, { cwd: root, stdio: 'inherit' }).status === 0;
const succeeds = (command, args) =>
  spawnSync(command, args, { cwd: root, stdio: 'ignore' }).status === 0;

function readEnvFile(file) {
  const values = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

if (!existsSync(envPath)) {
  copyFileSync(path.join(root, '.env.example'), envPath);
  step('Created .env from .env.example.');
}

const fileValues = readEnvFile(envPath);
const setting = (name) => (process.env[name] ?? fileValues[name] ?? '').trim();
const childEnv = { ...process.env, PORT: port };

const realData =
  setting('TMDB_READ_TOKEN') !== '' && !['1', 'true'].includes(setting('TMDB_FIXTURES'));
if (!realData) childEnv.TMDB_FIXTURES = '1';

let watchlist = false;
if (setting('DATABASE_URL') === '') {
  step('No DATABASE_URL in .env, so the watchlist is off.');
} else if (!succeeds('docker', ['info'])) {
  step(
    'Docker is not running, so the watchlist is off. Start Docker and run pnpm dev again to enable it.',
  );
} else {
  step('Starting Postgres in Docker…');
  watchlist = run('docker', ['compose', 'up', '-d', '--wait', 'db']);
  if (watchlist) {
    step('Applying database migrations…');
    watchlist = run('pnpm', ['--silent', '-C', 'packages/db', 'db:deploy']);
  }
  if (!watchlist) {
    step('Postgres did not start (is port 54339 already in use?), so the watchlist is off.');
  }
}
if (!watchlist) childEnv.DATABASE_URL = '';

// The generated Prisma client is part of the build even when no database is attached.
step('Generating the Prisma client…');
if (!run('pnpm', ['--silent', 'db:generate'])) process.exit(1);

const askWithClaude = setting('ANTHROPIC_API_KEY') !== '';
process.stdout.write(`
  \u001b[1mMarquee\u001b[0m  http://localhost:${port}

  Movie data   ${realData ? 'TMDB (your token)' : 'recorded fixtures (add TMDB_READ_TOKEN to .env for live data)'}
  Watchlist    ${watchlist ? 'on (local Postgres)' : 'off'}
  Ask chat     ${askWithClaude ? 'Claude' : 'title search (add ANTHROPIC_API_KEY to .env for Claude)'}

`);

const app = spawn('pnpm', ['-C', 'apps/web', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: childEnv,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.kill(signal));
app.on('exit', (code) => process.exit(code ?? 0));
