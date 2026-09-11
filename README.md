# Genesis

Genesis ist unsere kleine Browser-Simulation der kosmischen Geschichte: vom heißen Quark-Plasma bis zu Planeten. Acht Stationen, zum Abspielen oder Scrubben. Die Bilder sollen klar und schön sein — nicht physikalisch exakt.

**Live:** [https://markovigele.github.io/genesis/](https://markovigele.github.io/genesis/)

WebGL, am besten Chrome. Telefon geht, inkl. Safe-Area.

## Stationen

Die Reihenfolge ist fest. Die Milchstraße steht vor der Sonne — unser Sonnensystem entsteht in einer bereits bestehenden Galaxie.

1. **Quarks** — heißes Plasma
2. **Kerne** — Wasserstoff und Helium
3. **Atome** — das All wird durchsichtig
4. **Moleküle** — Gaswolken
5. **Erste Sterne**
6. **Milchstraße**
7. **Sonne**
8. **Planeten** — Scheibe wird Welt

Play/Pause, Zeitlinie ziehen, oder eine Station antippen. Leertaste und Pfeile gehen am Rechner. Autoplay bleibt bei jeder Station länger stehen und wechselt dann langsam zur nächsten — bewusst ruhig, zum Lesen und Zuschauen.

## Lokal

Voraussetzung: Node 22.

```bash
npm install
npm run dev
```

Die Dev-URL liegt unter `/genesis/` (gleicher Base-Pfad wie GitHub Pages):

`http://localhost:5173/genesis/`

Produktion lokal prüfen:

```bash
npm run build
npm run preview
```

Dann: `http://localhost:4173/genesis/`

## GitHub Pages

Wir bauen mit Vite, `base` ist `/genesis/`. Der Workflow `.github/workflows/pages.yml` deployt bei Push auf `main` (und per `workflow_dispatch`) nach GitHub Pages.

Nach dem Merge:

1. Actions → **Deploy GitHub Pages** sollte einmal grün laufen.
2. Settings → Pages: Quelle **GitHub Actions**.
3. Öffnen: https://markovigele.github.io/genesis/

## Team

Nüchtern, klein, aus Österreich. INGENIUMOWL.
