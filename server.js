// server.ts
import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { ZipArchive } from "archiver";

// src/data/curriculum.ts
var NYELVTAN_CURRICULUM = {
  A1: [
    { id: "a1-1", number: 1, level: "A1", title: "L\xE9tige kijelent\xE9s", pattern: "am, is, are" },
    { id: "a1-2", number: 2, level: "A1", title: "L\xE9tige k\xE9rd\xE9s", pattern: "Am I?, Are you?, Is he?" },
    { id: "a1-3", number: 3, level: "A1", title: "L\xE9tige tagad\xE1s", pattern: "am not, aren\u2019t, isn\u2019t" },
    { id: "a1-4", number: 4, level: "A1", title: "Szem\xE9lyes n\xE9vm\xE1s", pattern: "I, you, he, she, it, we, they" },
    { id: "a1-5", number: 5, level: "A1", title: "Birtokos n\xE9vm\xE1sok", pattern: "my, your, his, her, our, their" },
    { id: "a1-6", number: 6, level: "A1", title: "Szem\xE9lyes n\xE9vm\xE1s t\xE1rgyesete", pattern: "me, you, him, her, us, them" },
    { id: "a1-7", number: 7, level: "A1", title: "Helyet jel\xF6l\u0151 el\xF6lj\xE1r\xF3k", pattern: "behind, in front of, under, between, opposite" },
    { id: "a1-8", number: 8, level: "A1", title: "Id\u0151t jel\xF6l\u0151 el\xF6lj\xE1r\xF3k", pattern: "in, on, at" },
    { id: "a1-9", number: 9, level: "A1", title: "There vagy it?", pattern: "There is / There are vs It is" },
    { id: "a1-10", number: 10, level: "A1", title: "Folyamatos jelen kijelent\xE9s, tagad\xE1s", pattern: "I\u2019m going / I\u2019m not going" },
    { id: "a1-11", number: 11, level: "A1", title: "Folyamatos jelen k\xE9rd\xE9s", pattern: "Are you going\u2026?, Is he going...?" },
    { id: "a1-12", number: 12, level: "A1", title: "Folyamatos jelen \xF6sszefoglal\xE1s", pattern: "Present Continuous full usage" },
    { id: "a1-13", number: 13, level: "A1", title: "Egyszer\u0171 jelen", pattern: "I go, you go, he goes" },
    { id: "a1-14", number: 14, level: "A1", title: "Egyszer\u0171 jelen tagad\xE1s", pattern: "I don\u2019t go, he doesn\u2019t go" },
    { id: "a1-15", number: 15, level: "A1", title: "Egyszer\u0171 jelen k\xE9rd\xE9s", pattern: "Do you go?, Does he go?" },
    { id: "a1-16", number: 16, level: "A1", title: "Egyszer\u0171 jelen \xF6sszefoglal\xE1s (1)", pattern: "Sz\xF3rend \xE9s alapig\xE9k" },
    { id: "a1-17", number: 17, level: "A1", title: "Egyszer\u0171 jelen \xF6sszefoglal\xE1s (2)", pattern: "Mindennapi rutinok \xE9s gyakoris\xE1g" },
    { id: "a1-18", number: 18, level: "A1", title: "Egyszer\u0171 jelen \xF6sszefoglal\xE1s (3)", pattern: "Id\u0151hat\xE1roz\xF3k (always, often, never)" },
    { id: "a1-19", number: 19, level: "A1", title: "K\xF6t\u0151szavak", pattern: "and, but, so, because, or" },
    { id: "a1-20", number: 20, level: "A1", title: "Many vagy much", pattern: "megsz\xE1ml\xE1lhat\xF3 vs megsz\xE1ml\xE1lhatatlan" },
    { id: "a1-21", number: 21, level: "A1", title: "K\xE9rd\u0151szavak", pattern: "who, what, where, when, how" },
    { id: "a1-22", number: 22, level: "A1", title: "Ige + prepoz\xEDci\xF3", pattern: "look at..., listen to\u2026" },
    { id: "a1-23", number: 23, level: "A1", title: "L\xE9tige m\xFAlt id\u0151 kijelent\xE9s", pattern: "was, were" },
    { id: "a1-24", number: 24, level: "A1", title: "L\xE9tige k\xE9rd\xE9s m\xFAltban", pattern: "Were you?, Was he?" },
    { id: "a1-25", number: 25, level: "A1", title: "L\xE9tige tagad\xE1s m\xFAltban", pattern: "was not/wasn\u2019t, were not/weren\u2019t" }
  ],
  A2: [
    { id: "a2-1", number: 1, level: "A2", title: "Egyszer\u0171 jelen halad\xF3bb", pattern: "I go, He goes, Do I/Does he go?" },
    { id: "a2-2", number: 2, level: "A2", title: "Egyszer\u0171 jelen kiv\xE9telek \xE9s helyes\xEDr\xE1s", pattern: "tries, watches, mixes" },
    { id: "a2-3", number: 3, level: "A2", title: "N\xE9vm\xE1sok \xF6sszehasonl\xEDt\xE1sa", pattern: "my, me, mine" },
    { id: "a2-4", number: 4, level: "A2", title: "Folyamatos jelen kijelent\xE9s halad\xF3bb", pattern: "I\u2019m going, you\u2019re going, he\u2019s going" },
    { id: "a2-5", number: 5, level: "A2", title: "Folyamatos jelen k\xE9rd\xE9s", pattern: "Am I doing, Are you doing, Is he doing?" },
    { id: "a2-6", number: 6, level: "A2", title: "There vagy it", pattern: "There is a problem vs It is cold" },
    { id: "a2-7", number: 7, level: "A2", title: "Many vagy much & mennyis\xE9gek", pattern: "How much / How many" },
    { id: "a2-8", number: 8, level: "A2", title: "K\xE9rd\u0151szavak \xE1rnyalatai", pattern: "who, whose, what, why, where, when, how" },
    { id: "a2-9", number: 9, level: "A2", title: "Who, who's, whose", pattern: "Ki vs Kinek a... vs Ki van" },
    { id: "a2-10", number: 10, level: "A2", title: "T\xE1rgyeset \xE9s visszahat\xF3 n\xE9vm\xE1sok", pattern: "me, myself, him, himself" },
    { id: "a2-11", number: 11, level: "A2", title: "Would like, can, should", pattern: "udvarias k\xE9r\xE9s, k\xE9pess\xE9g, tan\xE1cs" },
    { id: "a2-12", number: 12, level: "A2", title: "Mustn't vagy needn't / don't have to", pattern: "tilos vs nem sz\xFCks\xE9ges" },
    { id: "a2-13", number: 13, level: "A2", title: "Egyszer\u0171 m\xFAlt kijelent\xE9s", pattern: "I walked, I went" },
    { id: "a2-14", number: 14, level: "A2", title: "Egyszer\u0171 m\xFAlt k\xE9rd\xE9s", pattern: "Did I go?, Who went?" },
    { id: "a2-15", number: 15, level: "A2", title: "Egyszer\u0171 m\xFAlt \xF6sszefoglal\xE1s", pattern: "Past Simple k\xE9rd\xE9s, tagad\xE1s, rendhagy\xF3 ig\xE9k" },
    { id: "a2-16", number: 16, level: "A2", title: "Befejezett jelen kijelent\xE9s", pattern: "I have done, he has done" },
    { id: "a2-17", number: 17, level: "A2", title: "Befejezett jelen tagad\xE1s", pattern: "haven\u2019t / hasn't done" },
    { id: "a2-18", number: 18, level: "A2", title: "Befejezett jelen k\xE9rd\xE9s", pattern: "Have I done? Has he done?" },
    { id: "a2-19", number: 19, level: "A2", title: "Befejezett jelen \xF6sszefoglal\xE1s", pattern: "Present Perfect \xE9lettapasztalat" },
    { id: "a2-20", number: 20, level: "A2", title: "Befejezett jelen \xE9s egyszer\u0171 m\xFAlt", pattern: "I have done vs I did" },
    { id: "a2-21", number: 21, level: "A2", title: "Felt\xE9teles j\xF6v\u0151 (First conditional)", pattern: "I\u2019ll go to Paris if I have the money" },
    { id: "a2-22", number: 22, level: "A2", title: "Hat\xE1rozatlan n\xE9vm\xE1sok", pattern: "something, anything, everything, nothing" },
    { id: "a2-23", number: 23, level: "A2", title: "Too vagy enough", pattern: "t\xFAl sok/kev\xE9s vs el\xE9g" },
    { id: "a2-24", number: 24, level: "A2", title: "\xD6sszehasonl\xEDt\xE1s", pattern: "As...as, than" },
    { id: "a2-25", number: 25, level: "A2", title: "N\xE9vel\u0151k", pattern: "A, an vagy the" }
  ],
  B1: [
    { id: "b1-1", number: 1, level: "B1", title: "So / such / such a", pattern: "fokoz\xE1s \xE9s k\xF6vetkezm\xE9ny" },
    { id: "b1-2", number: 2, level: "B1", title: "Mell\xE9knevek/hat\xE1roz\xF3k k\xF6z\xE9p- \xE9s fels\u0151foka", pattern: "better/the best, more careful" },
    { id: "b1-3", number: 3, level: "B1", title: "Akt\xEDv \xE9s passz\xEDv jelenben \xE9s m\xFAltban", pattern: "write/wrote vs is written/was written" },
    { id: "b1-4", number: 4, level: "B1", title: "J\xF6v\u0151 id\u0151 kifejez\xE9se", pattern: "will, be going to, Present Continuous" },
    { id: "b1-5", number: 5, level: "B1", title: "Egyszer\u0171 \xE9s folyamatos m\xFAlt id\u0151", pattern: "I went vs I was going" },
    { id: "b1-6", number: 6, level: "B1", title: "For / since id\u0151hat\xE1roz\xF3k", pattern: "for five years, since 1987" },
    { id: "b1-7", number: 7, level: "B1", title: "Befejezett jelen vs egyszer\u0171 m\xFAlt", pattern: "have done vs did" },
    { id: "b1-8", number: 8, level: "B1", title: "Befejezett m\xFAlt (Past perfect)", pattern: "had gone" },
    { id: "b1-9", number: 9, level: "B1", title: "Egyszer\u0171 \xE9s befejezett m\xFAlt viszonya", pattern: "went vs had gone" },
    { id: "b1-10", number: 10, level: "B1", title: "Egyszer\u0171 vs folyamatos jelen n\xFCanszok", pattern: "state vs action verbs" },
    { id: "b1-11", number: 11, level: "B1", title: "Used to", pattern: "m\xFAltbeli megsz\u0171nt szok\xE1s" },
    { id: "b1-12", number: 12, level: "B1", title: "Must / have to / mustn\u2019t / don\u2019t have to", pattern: "k\xF6teless\xE9g \xE9s tilt\xE1s" },
    { id: "b1-13", number: 13, level: "B1", title: "It's time / it\u2019s high time", pattern: "ideje, hogy..." },
    { id: "b1-14", number: 14, level: "B1", title: "Vonatkoz\xF3 mell\xE9kmondat (Relative clause)", pattern: "what / which / that / who" },
    { id: "b1-15", number: 15, level: "B1", title: "Felt\xE9teles mondatok - 2nd conditional", pattern: "If I were you, I would do the same" },
    { id: "b1-16", number: 16, level: "B1", title: "Id\xE9zett besz\xE9d - felsz\xF3l\xEDt\xE1sok", pattern: "Ann asked me to clean her bike" },
    { id: "b1-17", number: 17, level: "B1", title: "Id\xE9zett besz\xE9d - tilt\xE1s", pattern: "told us not to play football" },
    { id: "b1-18", number: 18, level: "B1", title: "F\xFCgg\u0151 / id\xE9zett k\xE9rd\xE9sek", pattern: "asked me if I wanted to dance" },
    { id: "b1-19", number: 19, level: "B1", title: "Some / any / no / every", pattern: "hat\xE1rozatlan n\xE9vm\xE1sok \xF6sszet\xE9telei" },
    { id: "b1-20", number: 20, level: "B1", title: "One / ones / it / they / them", pattern: "sz\xF3ism\xE9tl\xE9s elker\xFCl\xE9se" },
    { id: "b1-21", number: 21, level: "B1", title: "(a) little / (a) few", pattern: "van egy kev\xE9s vs alig van" },
    { id: "b1-22", number: 22, level: "B1", title: "Both / either / neither / all / none", pattern: "k\xE9t vagy t\xF6bb elemre vonatkoz\xE1s" },
    { id: "b1-23", number: 23, level: "B1", title: "Either / both / other / another / each other", pattern: "egym\xE1s \xE9s m\xE1sik" },
    { id: "b1-24", number: 24, level: "B1", title: "Although / however", pattern: "ellent\xE9t kifejez\xE9se" },
    { id: "b1-25", number: 25, level: "B1", title: "Make / do", pattern: "kollok\xE1ci\xF3k \xE9s k\xFCl\xF6nbs\xE9gek" }
  ],
  B2: [
    { id: "b2-1", number: 1, level: "B2", title: "Even though / in spite of", pattern: "megenged\u0151 k\xF6t\u0151szavak \xE9s vonzatok" },
    { id: "b2-2", number: 2, level: "B2", title: "Felt\xE9teles mondatok / 3rd conditional", pattern: "I would have helped you if you had called" },
    { id: "b2-3", number: 3, level: "B2", title: "Felt\xE9teles mondatok \xF6sszefoglal\xE1s", pattern: "j\xF6v\u0151 / jelen / m\xFAlt vegyes t\xEDpusok" },
    { id: "b2-4", number: 4, level: "B2", title: "Id\xE9zett besz\xE9d halad\xF3", pattern: "id\u0151egyeztet\xE9s \xE9s hat\xE1roz\xF3k v\xE1ltoz\xE1sa" },
    { id: "b2-5", number: 5, level: "B2", title: "Used to vs would m\xFAlt id\u0151ben", pattern: "cselekv\xE9s vs \xE1llapot" },
    { id: "b2-6", number: 6, level: "B2", title: "Folyamatos j\xF6v\u0151 (Future continuous)", pattern: "This time next year I will be sunbathing" },
    { id: "b2-7", number: 7, level: "B2", title: "Befejezett j\xF6v\u0151 (Future perfect)", pattern: "will have worked by noon" },
    { id: "b2-8", number: 8, level: "B2", title: "Passz\xEDv jelen id\u0151kben", pattern: "is built / is being built / has been built" },
    { id: "b2-9", number: 9, level: "B2", title: "Szenved\u0151 / passz\xEDv m\xFAlt id\u0151kben", pattern: "was built, was being built, had been built" },
    { id: "b2-10", number: 10, level: "B2", title: "Szenved\u0151 / passz\xEDv j\xF6v\u0151 id\u0151kben", pattern: "will be done / will have been done" },
    { id: "b2-11", number: 11, level: "B2", title: "M\xF3dbeli seg\xE9dig\xE9k \xE1rnyalatai", pattern: "might, may, can, could, should, must" },
    { id: "b2-12", number: 12, level: "B2", title: "M\xF3dbeli seg\xE9dig\xE9k m\xFAlt ideje", pattern: "should / would / must / might / can\u2019t have done" },
    { id: "b2-13", number: 13, level: "B2", title: "Wish / if only - jelen", pattern: "I wish you were here" },
    { id: "b2-14", number: 14, level: "B2", title: "Wish / if only - m\xFAlt", pattern: "I wish I had called sooner" },
    { id: "b2-15", number: 15, level: "B2", title: "Wish / if only - j\xF6v\u0151", pattern: "I wish the sun would shine" },
    { id: "b2-16", number: 16, level: "B2", title: "Wish / if only \xF6sszefoglal\xE1s", pattern: "v\xE1gyakoz\xE1s \xE9s megb\xE1n\xE1s szintjei" },
    { id: "b2-17", number: 17, level: "B2", title: "Vagy-vagy, sem-sem", pattern: "either...or / neither...nor" },
    { id: "b2-18", number: 18, level: "B2", title: "It vs there finoms\xE1gok", pattern: "It seems vs There seems to be" },
    { id: "b2-19", number: 19, level: "B2", title: "To + f\u0151n\xE9vi igen\xE9v vs ing-es alak", pattern: "decide to do vs mind doing" },
    { id: "b2-20", number: 20, level: "B2", title: "M\u0171veltet\xE9s (Causative)", pattern: "have something done / make someone do" },
    { id: "b2-21", number: 21, level: "B2", title: "Used to / get used to / be used to", pattern: "megszok\xE1s f\xE1zisai" },
    { id: "b2-22", number: 22, level: "B2", title: "Would rather / prefer", pattern: "v\xE1laszt\xE1s \xE9s preferencia" },
    { id: "b2-23", number: 23, level: "B2", title: "Had better / would rather", pattern: "s\xFCrget\u0151 tan\xE1cs vs k\xEDv\xE1ns\xE1g" },
    { id: "b2-24", number: 24, level: "B2", title: "Keep / hold megk\xFCl\xF6nb\xF6ztet\xE9se", pattern: "tartani kontextusai" },
    { id: "b2-25", number: 25, level: "B2", title: "Vonzatos ig\xE9k (Phrasal verbs)", pattern: "look after, complain about, ask for" }
  ]
};

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var GEMINI_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
function isTransientError(error) {
  if (!error) return false;
  const msg = String(error?.message || error || "");
  const status = error?.status;
  const code = error?.code;
  if (status === "UNAVAILABLE" || status === 503 || code === 503) return true;
  if (status === "RESOURCE_EXHAUSTED" || status === 429 || code === 429) return true;
  if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("Spikes in demand") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.includes("overloaded") || msg.includes("temporarily unavailable")) {
    return true;
  }
  return false;
}
function cleanErrorMessage(error) {
  if (!error) return "Ismeretlen hiba t\xF6rt\xE9nt a gener\xE1l\xE1s sor\xE1n.";
  const raw = String(error?.message || error || "");
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      if (parsed.error.code === 503 || parsed.error.status === "UNAVAILABLE" || parsed.error.message.includes("high demand")) {
        return "A Google AI szerverei pillanatnyilag t\xFAlterheltek voltak (503 High Demand). A rendszer t\xF6bb modellel is automatikusan megpr\xF3b\xE1lta, k\xE9rlek pr\xF3b\xE1ld \xFAjra p\xE1r m\xE1sodperc m\xFAlva!";
      }
      return parsed.error.message;
    }
  } catch {
  }
  if (raw.includes("high demand") || raw.includes("503") || raw.includes("UNAVAILABLE")) {
    return "A Google AI szerverei pillanatnyilag t\xFAlterheltek voltak (503 High Demand). K\xE9rlek pr\xF3b\xE1ld \xFAjra egy pillanat m\xFAlva!";
  }
  return raw;
}
async function callGeminiWithFallback(prompt, config) {
  let lastError = null;
  for (let m = 0; m < GEMINI_MODELS.length; m++) {
    const model = GEMINI_MODELS[m];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini] Gener\xE1l\xE1s ind\xEDt\xE1sa: modell=${model}, k\xEDs\xE9rlet=${attempt + 1}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config
        });
        if (response && response.text) {
          console.log(`[Gemini] Sikeres gener\xE1l\xE1s (${model})`);
          return response.text;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] Hiba a(z) ${model} modelln\xE9l (k\xEDs\xE9rlet ${attempt + 1}):`, err?.message || err);
        if (isTransientError(err)) {
          const delayMs = (attempt + 1) * 1200 + Math.floor(Math.random() * 400);
          console.log(`[Gemini] Id\u0151szakos szervert\xFAlterhel\xE9s (503/429), v\xE1rakoz\xE1s ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          break;
        }
      }
    }
    if (m < GEMINI_MODELS.length - 1) {
      console.log(`[Gemini] \xC1tv\xE1lt\xE1s tartal\xE9k modellre: ${GEMINI_MODELS[m + 1]}`);
    }
  }
  throw new Error(cleanErrorMessage(lastError));
}
async function generateQuizData(level, topic, count = 10) {
  const prompt = `K\xE9sz\xEDts egy ${count} k\xE9rd\xE9sb\u0151l \xE1ll\xF3, kiv\xE1l\xF3 min\u0151s\xE9g\u0171 feleletv\xE1laszt\xF3s angol nyelvtani \xE9s sz\xF3kincs kv\xEDzt a Gyakorlatias Angol k\xF6z\xF6ss\xE9g sz\xE1m\xE1ra.
C\xE9lcsoport szintje: CEFR ${level} (pl. A1 Kezd\u0151, A2 Alapfok, B1 K\xF6z\xE9phalad\xF3, B2 Halad\xF3).
T\xE9ma / f\xF3kusz: "${topic}".
K\xF6vetelm\xE9nyek:
1. Pontosan ${count} k\xE9rd\xE9s legyen.
2. Minden k\xE9rd\xE9s mondatkieg\xE9sz\xEDt\xE9s ("gap fill") form\xE1tum\xFA legyen magyar nyelvtanul\xF3k tipikus hib\xE1ira f\xF3kusz\xE1lva (pl. "_______ a book on the table.", "I am looking forward to _______ you.", "He has been living here _______ 2018.").
3. 3 vagy 4 hiteles v\xE1laszlehet\u0151s\xE9g (options) k\xE9rd\xE9senk\xE9nt.
4. "correctIndex": a helyes v\xE1lasz 0-alap\xFA indexe.
5. "explanation": Vil\xE1gos, bar\xE1ts\xE1gos, k\xF6nnyen megjegyezhet\u0151 MAGYAR magyar\xE1zat a helyes v\xE1lasz ok\xE1r\xF3l (pl. mi\xE9rt nem j\xF3 a m\xE1sik opci\xF3).
6. "translation": A teljes mondat pontos \xE9s term\xE9szetes MAGYAR ford\xEDt\xE1sa.
7. "tip": R\xF6vid tipp vagy memoriter a magyar tanul\xF3knak.
8. Adj egy tal\xE1l\xF3 kv\xEDz c\xEDmet ("title") \xE9s egy 1 mondatos le\xEDr\xE1st ("description").`;
  const config = {
    systemInstruction: "Te vagy a Gyakorlatias Angol szakmai nyelvtan\xE1ra. St\xEDlusod k\xF6zvetlen, vil\xE1gos, b\xE1tor\xEDt\xF3 \xE9s rendk\xEDv\xFCl gyakorlatorient\xE1lt, kifejezetten magyar anyanyelv\u0171 tanul\xF3k gyakori buktat\xF3ira \xE9s t\xE9vhiteire szabva.",
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "A kv\xEDz c\xEDme magyarul \xE9s angolul" },
        description: { type: Type.STRING, description: "R\xF6vid le\xEDr\xE1s vagy instrukci\xF3" },
        level: { type: Type.STRING, description: "A1, A2, B1 vagy B2" },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Az angol mondat hi\xE1nyz\xF3 r\xE9sszel (______)" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 vagy 4 v\xE1laszlehet\u0151s\xE9g"
              },
              correctIndex: { type: Type.INTEGER, description: "A helyes opci\xF3 0-alap\xFA indexe" },
              explanation: { type: Type.STRING, description: "R\xE9szletes magyar nyelvtani magyar\xE1zat" },
              translation: { type: Type.STRING, description: "A helyes mondat magyar ford\xEDt\xE1sa" },
              tip: { type: Type.STRING, description: "R\xF6vid gyakorlati tipp" }
            },
            required: ["question", "options", "correctIndex", "explanation", "translation"]
          }
        }
      },
      required: ["title", "description", "level", "questions"]
    }
  };
  const responseText = await callGeminiWithFallback(prompt, config);
  const parsed = JSON.parse(responseText || "{}");
  if (parsed && Array.isArray(parsed.questions)) {
    parsed.questions = parsed.questions.map((q) => {
      if (!Array.isArray(q.options) || typeof q.correctIndex !== "number") return q;
      const correctText = q.options[q.correctIndex];
      const shuffled = [...q.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return {
        ...q,
        options: shuffled,
        correctIndex: Math.max(0, shuffled.indexOf(correctText))
      };
    });
  }
  return parsed;
}
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { level = "A2", topic = "Gyakorlatias nyelvtani teszt", count = 10 } = req.body;
    const data = await generateQuizData(level, topic, count);
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return res.status(500).json({
      success: false,
      error: cleanErrorMessage(error)
    });
  }
});
app.post("/api/generate-weekly-bundle", async (req, res) => {
  try {
    const { weekNumber = 46 } = req.body;
    const levels = ["A1", "A2", "B1", "B2"];
    const topicAssignments = levels.map((lvl) => {
      const topics = NYELVTAN_CURRICULUM[lvl];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      return {
        level: lvl,
        topic: `${randomTopic.title} (${randomTopic.pattern})`,
        topicNumber: randomTopic.number
      };
    });
    const results = [];
    for (let i = 0; i < topicAssignments.length; i++) {
      const t = topicAssignments[i];
      const data = await generateQuizData(t.level, t.topic, 10);
      results.push({
        level: t.level,
        topic: t.topic,
        topicNumber: t.topicNumber,
        data
      });
      if (i < topicAssignments.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }
    return res.json({
      success: true,
      weekNumber: Number(weekNumber) || 46,
      quizzes: results
    });
  } catch (error) {
    console.error("Error generating weekly bundle:", error);
    return res.status(500).json({
      success: false,
      error: cleanErrorMessage(error)
    });
  }
});
app.get("/api/download-source-zip", async (_req, res) => {
  try {
    const archive = new ZipArchive({
      zlib: { level: 9 }
    });
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filename = `gyakorlatias-angol-source-${today}.zip`;
    res.attachment(filename);
    res.setHeader("Content-Type", "application/zip");
    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Archiving failed" });
      }
    });
    archive.pipe(res);
    archive.glob("**/*", {
      cwd: __dirname,
      ignore: [
        "node_modules/**",
        "dist/**",
        ".git/**",
        ".env",
        "*.zip",
        ".DS_Store",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*"
      ],
      dot: true
    });
    await archive.finalize();
  } catch (error) {
    console.error("Zip download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Nem siker\xFClt l\xE9trehozni a ZIP arch\xEDvumot." });
    }
  }
});
function getClientDistPath() {
  const candidates = [
    path.resolve(__dirname, "dist"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(__dirname)
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "index.html"))) {
      return c;
    }
  }
  return null;
}
async function startServer() {
  const clientDist = getClientDistPath();
  const isDev = process.env.NODE_ENV === "development" || !clientDist && process.env.NODE_ENV !== "production";
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (clientDist) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gyakorlatias Angol server running at http://localhost:${PORT}`);
  });
}
startServer();
