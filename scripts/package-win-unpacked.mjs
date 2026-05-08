import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import packageJson from '../package.json' with { type: 'json' };

const root = resolve(import.meta.dirname, '..');
const source = join(root, 'release', 'win-unpacked');
const destination = join(root, 'release', `finch-win-unpacked-${packageJson.version}.zip`);

if (!existsSync(source)) {
  throw new Error(`Pasta nao encontrada: ${source}`);
}

if (existsSync(destination)) {
  rmSync(destination, { force: true });
}

execFileSync(
  'powershell.exe',
  [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `Compress-Archive -Path '${source}\\*' -DestinationPath '${destination}' -Force`
  ],
  { stdio: 'inherit' }
);

console.log(`Generated ${destination}`);
