import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'dist');
const outFile = path.join(outDir, 'source-snapshot.json');

const ROOT_FILES = [
  'package.json',
  'index.html',
  'server.ts',
  'tsconfig.json',
  'vite.config.ts',
  'metadata.json',
  '.env.example',
  '.gitignore',
];

const INCLUDE_DIRS = ['src', 'scripts'];

const EXCLUDED_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  '.env',
  '.DS_Store',
]);

function walkDir(dirPath, baseDir, collected) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, collected);
    } else if (entry.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      collected.push({
        path: relPath,
        content,
        size: Buffer.byteLength(content, 'utf-8'),
      });
    }
  }
}

const files = [];

for (const fileName of ROOT_FILES) {
  const fullPath = path.join(rootDir, fileName);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    files.push({
      path: fileName,
      content,
      size: Buffer.byteLength(content, 'utf-8'),
    });
  }
}

for (const dirName of INCLUDE_DIRS) {
  walkDir(path.join(rootDir, dirName), rootDir, files);
}

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
