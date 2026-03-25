# Exercise Tracker

A clean, modern React web app for visualizing workout data over a 31-day period.

## Features

- **Dashboard View** — Summary stats, bar charts for calories/sets, stacked cardio chart, muscle group breakdown
- **Calendar View** — Week-by-week grid of workouts with muscle tags, sets, reps, calories, and cardio info
- **Muscle Group Filter** — Filter all views by muscle group (chest, back, legs, shoulders, biceps, triceps, core, cardio) or view all
- **Mobile-friendly** — Responsive design works on all screen sizes

## Tech Stack

- **Vite** + **React**
- Pure CSS (no external UI libraries)
- No charting library dependency — uses lightweight custom SVG/CSS bar charts

## Data Format

Place your `data.csv` in `public/`. Required columns:

```
day,muscle_group,reps,sets,walk_min,cardio_min,hiit_min,calories
```

The included sample data covers 31 days of workouts.

## Local Development

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

### Option 1: Manual deploy

1. Build the project:
   ```bash
   npm run build
   ```

2. In your GitHub repo settings → Pages → Source: select the `dist` folder

3. Update `vite.config.js` with your repo name:
   ```js
   // vite.config.js
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()],
   })
   ```

### Option 2: GitHub Actions (recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Then push to `main`. The site will auto-deploy.

## Build

```bash
npm run build    # Output to dist/
npm run preview  # Preview the build locally
```
