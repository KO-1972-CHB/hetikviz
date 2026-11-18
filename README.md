# Heti Kvíz 4.0

## Indítás

Node.js 22.12 vagy újabb verzió ajánlott. Telepítsd a függőségeket az
`npm ci` paranccsal. Helyi fejlesztéshez futtasd az `npm run dev` parancsot.
A fejlesztői szerver alapértelmezésben csak a saját gépről érhető el.
A kiadáshoz futtasd az `npm run build`, majd az `npm start` parancsot.
Az alkalmazás alapértelmezett portja 3000.

A tanári belépéshez a szerveren állíts be egy egyedi, legalább 16 karakteres
`TEACHER_PASSWORD` jelszót. Az AI-generáláshoz `OPENAI_API_KEY` is kell.
Az opcionális `OPENAI_MODEL` alapértéke `gpt-4.1-mini`. Helyben a Gitből kizárt `.env` fájl használható. Élesben az üzemeltető
titoktárolóját, HTTPS-t és `NODE_ENV=production` beállítást használd.

A tanári munkamenet nyolc óráig tart, és a szerver újraindításakor megszűnik.
A korlátok szerverpéldányonként értendők. Percenként 10 belépési kísérlet,
12 kvíznyi generálás és 5 forráslekérés engedélyezett. Egy négyszintes
csomag négy generálásnak számít.

## Kiadás előtti ellenőrzés

- Futtasd az `npm run lint` és az `npm run build` parancsot.
- Diákként nyiss meg egy heti és egy archivált kvízt. Ellenőrizd a pontozást,
  a kiejtést, a hibák újragyakorlását és a 20 kérdéses szintfelmérőt.
- Tanárként lépj be, frissítsd az oldalt, majd lépj ki. Próbáld ki a forrásnézetet,
  a ZIP-letöltést és a generálást belépve.
- A mentett kvízek, kitűzések és eredmények az adott böngészőben és az adott
  webcímen érhetők el. A korábbi adatok ellenőrzéséhez használd ugyanazt a
  böngészőprofilt és webcímet. Egy külön tesztoldal saját böngészőtárolót kap.

## Kvízek közzététele

A Tanári Stúdióban a generált kvíz tervezetként jelenik meg. A kérdések
szerkeszthetők, az alkalmazás ellenőrzi a kérdésszámot, a feladatformát,
a megoldókulcsot, az ismétlődéseket, a magyarázatot és a fordítást. A külön
AI-ellenőrzés OpenAI-kulccsal kérhető. A közzétételhez tanári jóváhagyás kell.
A heti csomagban szintenként végezhető el az ellenőrzés és a közzététel.

Éles szerveren add meg a `PUBLISHED_QUIZ_DIR` változóban egy írható, tartós
lemezkötet mappáját. Helyben az alapértelmezett mappa a Gitből kizárt
`.quiz-data`. Minden publikálás önálló pillanatképet ad. Egy javított változat
új linket kap, a korábban megosztott link ugyanarra a változatra mutat.
A helyi mentés törlése csak a böngészőben lévő példányt érinti.

A csak Vite-tal összeállított Vercel-előnézetben a beépített kvízek és a
szintfelmérő kipróbálhatók. A kvízek közzététele és a megosztott kvízlinkek
kiszolgálása Express szervert és tartós tárolót igényel. A jelenlegi
fájlalapú közzététel tartós lemezkötetes, egyetlen szerverpéldányos üzemre készült.


## Saját gyakorlás

A heti kvíz eredményoldalán a „Mentés gyakorláshoz” művelettel jelölheted
meg a kérdéseket. A fejléc „Saját gyakorlás” nézetében szint és témakör
szerint szűrhetsz, és elindíthatod a kijelölt kérdések gyakorlását.
A mentések az adott böngészőben és webcímen maradnak.

## Tanári belépés a Vercelen

Ha már fut az Express API, a Vercel projekt **Settings → Environment
Variables** felületén a `TEACHER_PASSWORD` értéke legyen az egyedi, legalább
16 karakteres tanári jelszó. Válaszd ki a megfelelő környezetet
(`Preview` a tesztoldalhoz), majd indíts új telepítést. A jelszót ne tedd
`VITE_` kezdetű változóba, mert azok a böngészőcsomag részei lehetnek.

A csak `npx vite build` paranccsal kiadott oldalhoz nem tartozik Express
API. A tanári belépéshez és a kvízek közzétételéhez szerveroldali telepítés
kell. Több Vercel-példány esetén a munkamenetekhez és a korlátokhoz közös
tároló szükséges. A külön, tartós lemezkötetes Express-szerver a jelenlegi
tárolási kódot közvetlenül tudja használni.
