import React, { useState } from 'react';
import { X, Check, Copy, Sparkles, BookOpen, ShieldCheck, Trophy, Volume2, RotateCcw, Trash2, Calendar, FileText, Download } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onOpenTeacherStudio: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onOpenTeacherStudio,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const changelogText = `📋 GYAKORLATIAS ANGOL KVÍZPLATFORM — VERZIÓKÖVETÉS & FUNKCIÓKALAUZ (v4.0)

4.0: Szerveroldali tanári belépés; védett kvízgenerálás és forrásexport.

1. ⚡ 1-GOMBNYOMÁSOS HETI 4-ES KVÍZCSOMAG GENERÁLÁS (A1 + A2 + B1 + B2)
- Az AI Kvízkészítőben egyetlen gombnyomással legenerálható a hét mind a 4 szintjének (A1, A2, B1, B2) 10-10 kérdéses feladatsora!
- A rendszer mindegyik szinthez véletlenszerűen választ témát a 100 témás tematikából.
- A 4 kvíz automatikusan elmentésre és heti aktívnak kitűzésre kerül (Pinning).
- 1 kattintásos kombinált Facebook bejelentő posztszöveg másolása (mind a 4 szint közvetlen linkjével a csoportnak).

2. 🎯 300 MONDATOSRA BŐVÍTETT SZINTFELMÉRŐ (SZINTENKÉNT PONTOSAN 75 KÉRDÉS)
- A szintfelmérő kérdésbankja pontosan 300 autentikus mondatra bővült (szintenként egyenlően elosztva: 75 db A1, 75 db A2, 75 db B1, 75 db B2).
- Mind a 100 nyelvtani témakör lefedve részletes magyar magyarázatokkal és fordításokkal.
- A teszt random 20 kérdést sorsol (szintenként 5 db), így a tanuló minden kitöltéskor új mondatokkal találkozik!

3. ⭐ TANÁRI HETI KVÍZ VEZÉRLÉS & KITŰZÉS (PIN)
- A tanár a Kvízarchívumban a "⭐ Heti aktívnak" gombbal közvetlenül kijelölheti, hogy melyik kvíz jelenjen meg a tanulóknak heti feladatsorként szintenként.

4. 🎯 SZINTFELMÉRŐ HIBA-GYAKORLÁS PONTMEGŐRZÉSE
- A hibák újra gyakorlásakor az eredeti elért pontszám (pl. 18/20 pont) és a megállapított CEFR szint (pl. B2 Haladó) 100%-ban megőrződik!

9. 🔀 DINAMIKUS VÁLASZKEVERÉS
- Az opciók (a, b, c, d) minden megnyitáskor és újratöltéskor véletlenszerűen keverednek, a helyes válasz soha nem ragad le az 'a' betűnél.

10. 🔊 ANYANYELVI KIEJTÉS (RESPONSIVEVOICE & WEB SPEECH)
- Minden mondat meghallgatható prémium anyanyelvi kiejtéssel a beépített ResponsiveVoice motorral (kulcs: zfxll7vG).

11. 📦 TELJES FORRÁSKÓD BÖNGÉSZŐ ÉS EXPORT (.ZIP)
- Tanári módban külön fülön ("Forráskód") élőben megtekinthető és másolható az összes eredeti fájl (src, components, data, utils, package.json, server.ts), és a .ZIP letöltés élesített környezetben is a teljes eredeti forráskódot csomagolja be.`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(changelogText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const featureList = [
    {
      icon: <BookOpen className="w-5 h-5 text-teal-600" />,
      title: 'Roboto Tipográfia & Google Material Stílus',
      desc: 'Google Fonts Roboto (400 és 500) a teljes felületen, Medium (500) vastagságú, szűkített betűközű címsorok és letisztult, modern Material felületek.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      title: 'Heti Kvízek Gyorselérés a Fejlécben',
      desc: 'Közvetlenül a fejlécből 1 kattintással bármikor visszatérhetsz a heti kvízek alapoldalára, ahogyan a Szintfelmérő és a Heti Archívum gombokkal is.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      title: 'Letisztult Eredménymásolás (Link nélkül)',
      desc: 'Az eredmény szövegének másolásakor eltávolítottuk a felesleges promóciós linkeket, így a diákok azonnal posztolhatják az eredményt a Facebook csoportban.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
      title: 'Biztonságos Rendszerfelépítés',
      desc: 'A diákok számára a felület 100%-ban tiszta és zavartalan, az AI kvízgenerálás és adminisztráció védett háttérfelületen zajlik.',
    },
    {
      icon: <Trash2 className="w-5 h-5 text-rose-500" />,
      title: 'Kvízek Törlése & Kezelése',
      desc: 'Tanári módban a készített heti kvízek bármikor törölhetők megerősítéssel a Tanári Hub-ban vagy a Heti Archívumban.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      title: 'AI Kvízkészítő',
      desc: '1 kattintással generál 10 kérdéses heti csomagokat részletes magyar magyarázatokkal, fordításokkal és 1 kattintásos Facebook bejelentő poszttal.',
    },
    {
      icon: <Download className="w-5 h-5 text-emerald-600" />,
      title: 'Forráskód Böngésző & Teljes Export (.ZIP)',
      desc: 'Tanári módban élőben böngészhető és másolható minden eredeti fájl (src, components, package.json, server.ts), és 1 kattintással letölthető .zip archívumban.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
      title: '100 Témás Nyelvtan Tematika (A1-B2)',
      desc: 'A teljes Nyelvtanvarázsló tematika (4x25 témakör) beépítve a Tanári Stúdióba. Bármelyik témára kattintva azonnal indítható rá heti feladatsor.',
    },
    {
      icon: <Trophy className="w-5 h-5 text-indigo-500" />,
      title: '20 Kérdéses Szintfelmérő (300 mondatból)',
      desc: '300 kérdéses bankból (szintenként pontosan 75-75 feladat) kap 20 véletlenszerű kérdést a tanuló növekvő nehézségben (5 A1, 5 A2, 5 B1, 5 B2) részletes diagnózissal.',
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-orange-500" />,
      title: 'Csak a Hibák Újra Gyakorlása',
      desc: 'A kiértékelés mostantól csak a hibás mondatokra fókuszál. Egy külön gombbal azonnal újra gyakorolhatók kizárólag az elrontott kérdések.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      title: 'Tűzijáték Logika (80% Küszöb)',
      desc: '80% felett konfetti zápor, 100%-nál látványos dupla tűzijáték fal. 80% alatt nincs animáció, ezzel ösztönözve a javításra.',
    },
    {
      icon: <Volume2 className="w-5 h-5 text-teal-500" />,
      title: 'Anyanyelvi Kiejtés (ResponsiveVoice)',
      desc: 'Minden kérdésnél és kiértékelésnél prémium brit hangon (UK English Female) szólal meg a mondat a hivatalos ResponsiveVoice motorral.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-medium">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-medium text-slate-900 tracking-tight">
                  Rendszerverzió & Funkciókalauz
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                  v4.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Gyakorlatias Angol • Heti Kvíz és Szintfelmérő Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto py-3 space-y-4 pr-1 text-slate-800 flex-1">
          {/* Quick info banner */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>Platform Állapota: Élesben Működőképes (Production Ready)</span>
              <span className="text-emerald-700 font-black">100% Tesztelt</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Az alkalmazás a Gyakorlatias Angol közösség számára készült a heti 10 kérdéses feladatok és a 20 kérdéses szintfelmérő automatikus kezelésére.
            </p>
          </div>

          {/* Feature List Grid */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-700">
              A Rendszer Főbb Funkciói:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {featureList.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    {f.icon}
                    <h4 className="font-medium text-xs text-slate-900 tracking-tight">{f.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-7">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleCopySummary}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition border border-slate-200 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Leírás vágólapra másolva!' : 'Teljes funkciólista másolása'}</span>
          </button>

          <div className="flex flex-wrap items-center space-x-2 w-full sm:w-auto">
            {isAdmin && (
              <>
                <a
                  href="/api/download-source-zip"
                  download="gyakorlatias-angol-source.zip"
                  className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                  title="A teljes tiszta projekt forráskód letöltése .zip-ben"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Forráskód (.ZIP)</span>
                </a>

                <button
                  onClick={() => {
                    onClose();
                    onOpenTeacherStudio();
                  }}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs flex items-center justify-center space-x-1 transition shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tanári Stúdió</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
