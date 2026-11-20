import { collectSourceFiles } from './source-files.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'dist');
const outFile = path.join(outDir, 'source-snapshot.json');

const files = collectSourceFiles(rootDir);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(
  outFile,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalFiles: files.length,
    files,
  }),
  'utf-8'
);

console.log(`Source snapshot created: ${files.length} files -> ${path.relative(rootDir, outFile)}`);
