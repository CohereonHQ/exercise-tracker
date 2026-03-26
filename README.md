# Exercise Tracker

A clean React + Vite web app for visualising workout data — sets, reps, calories, and cardio over a 31-day cycle.

**Live:** https://CohereonHQ.github.io/exercise-tracker/

## Features

- **Dashboard** — stat cards (active days, sets, volume, calories, walk/cardio), bar charts for calories & sets, stacked cardio breakdown, muscle group progress bars
- **Calendar** — week-by-week grid view with prev/next navigation
- **Filter** — pill buttons to filter by muscle group (all/chest/back/legs/shoulders/biceps/triceps/core/cardio)
- **Mobile-friendly** — responsive grid layout
- **Zero external charting lib** — all charts are CSS/SVG

## Replacing the data

Drop your own CSV into `public/data.csv` with the same format as the sample. The format is:

```
Date,SUN 1,2,3,...,31,Sets
```

Where each row is a muscle group or cardio type, columns 1–31 are reps/duration per day, and the final column is the row total.

## Deploy

Deployed automatically via GitHub Actions on every push to `main`. See `.github/workflows/deploy.yml` for the pipeline.

## Dev

```bash
npm install
npm run dev    # dev server at http://localhost:5173
npm run build  # production build to dist/
```
