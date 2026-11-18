import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ZipArchive } from 'archiver';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

import { NYELVTAN_CURRICULUM } from './src/data/curriculum';

// Candidate models for graceful fallback if one model experiences high demand spikes (503/429)
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'] as const;

function isTransientError(error: any): boolean {
  if (!error) return false;
  const msg = String(error?.message || error || '');
  const status = error?.status;
  const code = error?.code;

  if (status === 'UNAVAILABLE' || status === 503 || code === 503) return true;
  if (status === 'RESOURCE_EXHAUSTED' || status === 429 || code === 429) return true;

  if (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand') ||
    msg.includes('Spikes in demand') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('429') ||
    msg.includes('overloaded') ||
    msg.includes('temporarily unavailable')
  ) {
    return true;
  }
  return false;
}

function cleanErrorMessage(error: any): string {
  if (!error) return 'Ismeretlen hiba történt a generálás során.';
  const raw = String(error?.message || error || '');
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      if (parsed.error.code === 503 || parsed.error.status === 'UNAVAILABLE' || parsed.error.message.includes('high demand')) {
        return 'A Google AI szerverei pillanatnyilag túlterheltek voltak (503 High Demand). A rendszer több modellel is automatikusan megpróbálta, kérlek próbáld újra pár másodperc múlva!';
      }
      return parsed.error.message;
    }
  } catch {
    // not JSON
  }

  if (raw.includes('high demand') || raw.includes('503') || raw.includes('UNAVAILABLE')) {
    return 'A Google AI szerverei pillanatnyilag túlterheltek voltak (503 High Demand). Kérlek próbáld újra egy pillanat múlva!';
  }

  return raw;
}

// Robust generator with automatic exponential backoff and model fallback cascade
async function callGeminiWithFallback(prompt: string, config: any): Promise<string> {
  let lastError: any = null;

  for (let m = 0; m < GEMINI_MODELS.length; m++) {
    const model = GEMINI_MODELS[m];

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Generálás indítása: modell=${model}, kísérlet=${attempt + 1}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        if (response && response.text) {
          console.log(`[Gemini] Sikeres generálás (${model})`);
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Hiba a(z) ${model} modellnél (kísérlet ${attempt + 1}):`, err?.message || err);

        if (isTransientError(err)) {
          const delayMs = (attempt + 1) * 1200 + Math.floor(Math.random() * 400);
          console.log(`[Gemini] Időszakos szervertúlterhelés (503/429), várakozás ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          // If non-transient error, don't repeat this model
          break;
        }
      }
    }

    if (m < GEMINI_MODELS.length - 1) {
      console.log(`[Gemini] Átváltás tartalék modellre: ${GEMINI_MODELS[m + 1]}`);
    }
  }

  throw new Error(cleanErrorMessage(lastError));
}

// Helper: Generates a 10-question quiz for a given CEFR level and grammar topic
async function generateQuizData(level: string, topic: string, count = 10) {
  const prompt = `Készíts egy ${count} kérdésből álló, kiváló minőségű feleletválasztós angol nyelvtani és szókincs kvízt a Gyakorlatias Angol közösség számára.
Célcsoport szintje: CEFR ${level} (pl. A1 Kezdő, A2 Alapfok, B1 Középhaladó, B2 Haladó).
Téma / fókusz: "${topic}".
Követelmények:
1. Pontosan ${count} kérdés legyen.
2. Minden kérdés mondatkiegészítés ("gap fill") formátumú legyen magyar nyelvtanulók tipikus hibáira fókuszálva (pl. "_______ a book on the table.", "I am looking forward to _______ you.", "He has been living here _______ 2018.").
3. 3 vagy 4 hiteles válaszlehetőség (options) kérdésenként.
4. "correctIndex": a helyes válasz 0-alapú indexe.
5. "explanation": Világos, barátságos, könnyen megjegyezhető MAGYAR magyarázat a helyes válasz okáról (pl. miért nem jó a másik opció).
6. "translation": A teljes mondat pontos és természetes MAGYAR fordítása.
7. "tip": Rövid tipp vagy memoriter a magyar tanulóknak.
8. Adj egy találó kvíz címet ("title") és egy 1 mondatos leírást ("description").`;

  const config = {
    systemInstruction:
      'Te vagy a Gyakorlatias Angol szakmai nyelvtanára. Stílusod közvetlen, világos, bátorító és rendkívül gyakorlatorientált, kifejezetten magyar anyanyelvű tanulók gyakori buktatóira és tévhiteire szabva.',
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'A kvíz címe magyarul és angolul' },
        description: { type: Type.STRING, description: 'Rövid leírás vagy instrukció' },
        level: { type: Type.STRING, description: 'A1, A2, B1 vagy B2' },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'Az angol mondat hiányzó résszel (______)' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 vagy 4 válaszlehetőség',
              },
              correctIndex: { type: Type.INTEGER, description: 'A helyes opció 0-alapú indexe' },
              explanation: { type: Type.STRING, description: 'Részletes magyar nyelvtani magyarázat' },
              translation: { type: Type.STRING, description: 'A helyes mondat magyar fordítása' },
              tip: { type: Type.STRING, description: 'Rövid gyakorlati tipp' },
            },
            required: ['question', 'options', 'correctIndex', 'explanation', 'translation'],
          },
        },
      },
      required: ['title', 'description', 'level', 'questions'],
    },
  };

  const responseText = await callGeminiWithFallback(prompt, config);

  const parsed = JSON.parse(responseText || '{}');
  if (parsed && Array.isArray(parsed.questions)) {
    parsed.questions = parsed.questions.map((q: any) => {
      if (!Array.isArray(q.options) || typeof q.correctIndex !== 'number') return q;
      const correctText = q.options[q.correctIndex];
      const shuffled = [...q.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return {
        ...q,
        options: shuffled,
        correctIndex: Math.max(0, shuffled.indexOf(correctText)),
      };
    });
  }
  return parsed;
}

// Endpoint: Single 10-Question Quiz Generator
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { level = 'A2', topic = 'Gyakorlatias nyelvtani teszt', count = 10 } = req.body;
    const data = await generateQuizData(level, topic, count);
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({
      success: false,
      error: cleanErrorMessage(error),
    });
  }
});

// Endpoint: 1-Click Multi-Level Weekly Bundle Generator (A1 + A2 + B1 + B2)
app.post('/api/generate-weekly-bundle', async (req, res) => {
  try {
    const { weekNumber = 46 } = req.body;
    const levels = ['A1', 'A2', 'B1', 'B2'] as const;

    // Pick a random curriculum topic for each level from the 100-point curriculum
    const topicAssignments = levels.map((lvl) => {
      const topics = NYELVTAN_CURRICULUM[lvl];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      return {
        level: lvl,
        topic: `${randomTopic.title} (${randomTopic.pattern})`,
        topicNumber: randomTopic.number,
      };
    });

    // Execute sequentially with slight spacing to prevent simultaneous burst rate limits / 503 spikes
    const results = [];
    for (let i = 0; i < topicAssignments.length; i++) {
      const t = topicAssignments[i];
      const data = await generateQuizData(t.level, t.topic, 10);
      results.push({
        level: t.level,
        topic: t.topic,
        topicNumber: t.topicNumber,
        data,
      });

      // Small 300ms pause between questions to respect Gemini API bursts
      if (i < topicAssignments.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    return res.json({
      success: true,
      weekNumber: Number(weekNumber) || 46,
      quizzes: results,
    });
  } catch (error: any) {
    console.error('Error generating weekly bundle:', error);
    return res.status(500).json({
      success: false,
      error: cleanErrorMessage(error),
    });
  }
});

interface SourceFileEntry {
  path: string;
  content: string;
  size: number;
}

const ROOT_SOURCE_FILES = [
  'package.json',
  'index.html',
  'server.ts',
  'tsconfig.json',
  'vite.config.ts',
  'metadata.json',
  '.env.example',
  '.gitignore',
];

function getProjectRootPath(): string | null {
  const candidates = [
    process.cwd(),
    __dirname,
    path.resolve(__dirname, '..'),
  ];
  for (const c of candidates) {
    if (
      fs.existsSync(path.join(c, 'package.json')) &&
      fs.existsSync(path.join(c, 'src', 'App.tsx'))
    ) {
      return c;
    }
  }
  return null;
}

function walkSourceDir(dirPath: string, baseDir: string, collected: SourceFileEntry[]) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', '.env', '.DS_Store'].includes(entry.name)) {
      continue;
    }
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      walkSourceDir(fullPath, baseDir, collected);
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

function getAllProjectSourceFiles(): SourceFileEntry[] {
  const projectRoot = getProjectRootPath();

  if (projectRoot) {
    const files: SourceFileEntry[] = [];
    for (const fileName of ROOT_SOURCE_FILES) {
      const fullPath = path.join(projectRoot, fileName);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({
          path: fileName,
          content,
          size: Buffer.byteLength(content, 'utf-8'),
        });
      }
    }
    walkSourceDir(path.join(projectRoot, 'src'), projectRoot, files);
    walkSourceDir(path.join(projectRoot, 'scripts'), projectRoot, files);
    if (files.length > 0) {
      return files;
    }
  }

  // Fallback for stripped production environments: read bundled source snapshot
  const snapshotCandidates = [
    path.resolve(__dirname, 'source-snapshot.json'),
    path.resolve(__dirname, 'dist', 'source-snapshot.json'),
    path.resolve(process.cwd(), 'dist', 'source-snapshot.json'),
  ];
  for (const snapPath of snapshotCandidates) {
    if (fs.existsSync(snapPath)) {
      try {
        const raw = fs.readFileSync(snapPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.files)) {
          return parsed.files;
        }
      } catch (err) {
        console.error('Error reading source snapshot:', err);
      }
    }
  }

  return [];
}

// Endpoint: Return project source files & contents for Teacher Mode Source Viewer
app.get('/api/source-files', (_req, res) => {
  try {
    const files = getAllProjectSourceFiles();
    return res.json({
      success: true,
      totalFiles: files.length,
      files,
    });
  } catch (error: any) {
    console.error('Source files read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Nem sikerült beolvasni a projekt forrásfájljait.',
    });
  }
});

// Endpoint: Download clean project source code as a ZIP archive (for Teacher mode)
app.get('/api/download-source-zip', async (_req, res) => {
  try {
    const files = getAllProjectSourceFiles();
    if (files.length === 0) {
      return res.status(404).json({ error: 'Nem találhatók a forrásfájlok.' });
    }

    const archive = new ZipArchive({
      zlib: { level: 9 },
    });

    const today = new Date().toISOString().slice(0, 10);
    const filename = `gyakorlatias-angol-source-${today}.zip`;

    res.attachment(filename);
    res.setHeader('Content-Type', 'application/zip');

    archive.on('error', (err: any) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Archiving failed' });
      }
    });

    archive.pipe(res);

    for (const file of files) {
      archive.append(file.content, { name: file.path });
    }

    await archive.finalize();
  } catch (error: any) {
    console.error('Zip download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Nem sikerült létrehozni a ZIP archívumot.' });
    }
  }
});

// Helper to find the client dist folder containing index.html in any execution environment
function getClientDistPath(): string | null {
  const candidates = [
    path.resolve(__dirname, 'dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html'))) {
      return c;
    }
  }
  return null;
}

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const clientDist = getClientDistPath();
  const isDev = process.env.NODE_ENV === 'development' || (!clientDist && process.env.NODE_ENV !== 'production');

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gyakorlatias Angol server running at http://localhost:${PORT}`);
  });
}

startServer();
