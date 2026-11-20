import type { SharedStore } from './shared-store.js';
import { createHash, randomUUID } from 'node:crypto';
import { link, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Express, RequestHandler } from 'express';
import type { QuizPackage } from './src/types.js';
import { publishedQuizId, reviewQuiz } from './src/utils/quizReview.js';

export function registerPublishedQuizzes(app: Express, requireTeacher: RequestHandler, limitPublish: RequestHandler, store: SharedStore) {
  const directory = process.env.PUBLISHED_QUIZ_DIR ||
    (process.env.NODE_ENV === 'production' || process.env.VERCEL ? undefined : '.quiz-data');

  app.post('/api/published-quizzes', requireTeacher, limitPublish, async (req, res) => {
    if (!directory && !store) return res.status(503).json({ error: 'A közzétételhez tartós tárolót kell beállítani.' });
    if (req.body?.approved !== true) return res.status(400).json({ error: 'Tanári jóváhagyás szükséges.' });
    const quiz: QuizPackage = req.body.quiz;
    const errors = reviewQuiz(quiz);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    const content = {
      title: quiz.title, subtitle: quiz.subtitle, level: quiz.level, weekNumber: quiz.weekNumber,
      year: quiz.year, topic: quiz.topic,
      questions: quiz.questions.map((q, i) => ({
        id: `q-${i + 1}`, question: q.question, options: q.options, correctIndex: q.correctIndex,
        explanation: q.explanation, translation: q.translation, tip: q.tip,
      })),
    };
    const id = 'published-' + createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 32);
    const published = { ...content, id };
    try {
      if (store) {
        await store.setQuiz(`quiz:${id}`, JSON.stringify(published));
      } else if (directory) {
        const temporary = path.join(directory, `.${randomUUID()}.tmp`);
        await mkdir(directory, { recursive: true });
        await writeFile(temporary, JSON.stringify(published), { flag: 'wx', mode: 0o600 });
        try {
          await link(temporary, path.join(directory, `${id}.json`));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        } finally {
          await unlink(temporary);
        }
      }
      return res.status(201).json({ id });
    } catch (error) {
      console.error('Quiz publication failed:', error);
      return res.status(500).json({ error: 'A kvíz közzététele sikertelen. Próbáld újra!' });
    }
  });

  app.get('/api/published-quizzes/:id', async (req, res) => {
    if (!publishedQuizId.test(req.params.id)) return res.status(404).json({ error: 'A kvíz nem található.' });
    if (!directory && !store) return res.status(503).json({ error: 'A közzétett kvízek tárolója nincs beállítva.' });
    try {
      const quiz = store
        ? await store.get(`quiz:${req.params.id}`)
        : directory && await readFile(path.join(directory, `${req.params.id}.json`), 'utf8');
      if (!quiz) return res.status(404).json({ error: 'A kvíz nem található.' });
      res.set('Cache-Control', 'public, max-age=300').type('application/json').send(quiz);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({ error: 'A kvíz nem található.' });
      }
      console.error('Published quiz read failed:', error);
      return res.status(500).json({ error: 'A kvíz most nem tölthető be.' });
    }
  });
}
