import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), '..');
const appNextDir = path.join(repoRoot, 'app', '.next');
const rootNextDir = path.join(repoRoot, '.next');

if (!existsSync(appNextDir)) {
  throw new Error(`Next build output not found at ${appNextDir}`);
}

rmSync(rootNextDir, { recursive: true, force: true });
mkdirSync(path.dirname(rootNextDir), { recursive: true });
cpSync(appNextDir, rootNextDir, { recursive: true });

console.log(`Synced ${appNextDir} -> ${rootNextDir}`);
