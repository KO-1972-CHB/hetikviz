import fs from 'node:fs';
import path from 'node:path';

const ROOT_FILES = [
  'package.json',
  'package-lock.json',
  'README.md',
  'teacher-access.ts',
  'published-quizzes.ts',
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
    } else if (entry.isFile() && /\.(ts|tsx|css|mjs)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      collected.push({
        path: relPath,
        content,
        size: Buffer.byteLength(content, 'utf-8'),
      });
    }
  }
}

export function collectSourceFiles(rootDir) {
  const files = [];

  for (const fileName of ROOT_FILES) {
    const fullPath = path.join(rootDir, fileName);
    if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isFile()) {
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

  return files;
}
