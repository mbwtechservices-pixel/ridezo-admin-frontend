#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = 'ridezo-admin';

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);

  while (true) {
    const pkgPath = path.join(dir, 'package.json');
    if (
      fs.existsSync(path.join(dir, 'index.html')) &&
      fs.existsSync(path.join(dir, 'vite.config.ts')) &&
      fs.existsSync(pkgPath)
    ) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name === MARKER) {
        return dir;
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  throw new Error(
    'Could not find ridezo-admin project root. In Vercel, set Root Directory to empty (repository root).',
  );
}

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = findProjectRoot(scriptsDir);

process.chdir(projectRoot);
execSync('npm ci --include=dev', { stdio: 'inherit', env: { ...process.env, NPM_CONFIG_PRODUCTION: 'false' } });
