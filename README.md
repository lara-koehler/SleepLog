# SleepLog

A small installable web app for tracking sleep by hand: tap when you go to bed and when you wake up, rate how you feel, and see how sleep timing and duration relate to how you felt.

Live app: **https://lara-koehler.github.io/SleepLog/**

## Why tap instead of an automatic alarm

A web app can't read data from your phone's built-in alarm/clock app, and can't reliably act as a real wake-up alarm either (no exact-time guarantees, no do-not-disturb bypass). So logging here is manual and simple: two taps a day.

## Features

- **Log tab** — one big button at a time: "Going to sleep" logs the current time, then "I'm awake" logs the wake time, then you rate how you feel on a 1–5 scale.
- **5-minute guard** — if less than 5 minutes pass between the two taps (e.g. just trying the buttons out), you can still pick a demo rating to see the flow, but the record is discarded rather than saved.
- **Stats tab** — one full-page chart at a time:
  - Swipe up/down to move between Sleep duration, Bedtime, and Wake-up time (each vs. how you felt).
  - Swipe right on any chart to switch from individual points to a binned/averaged trend view (15-minute buckets).
  - Points are colored by recency (lighter = older, darker = more recent); tap a point to see its date, bedtime, wake-up time, and duration.
  - Date range selector (2 weeks / 1 month / 2 months / 6 months / all time), defaulting to 2 months.
- **CSV export/import** — top-right buttons on the Stats page. Export downloads all your data as a CSV; import reads one back in. Import *adds* records rather than replacing existing data.

## Installing it on your phone

This is a PWA (Progressive Web App), so there's no app store step:

1. Open the live URL above in your phone's browser (Chrome on Android).
2. Use the browser menu's "Add to Home Screen" option (Chrome may also prompt this automatically).
3. It installs a real home-screen icon and opens full-screen, like a native app.

This only works over HTTPS, which the GitHub Pages deployment provides.

## Data & privacy

All data is stored locally on your device (in the browser's IndexedDB), not on a server. That means:

- Nothing you log ever leaves your phone.
- Uninstalling the app or clearing site data **permanently deletes it** — there's no cloud backup.
- Use the CSV export button periodically if you want a backup, or want to move data to a new phone (via CSV import there).

## Development

```
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

Stack: React + TypeScript + Vite, `vite-plugin-pwa` for the installable/offline shell, `idb` for IndexedDB access, and Recharts for the charts. Deploys to GitHub Pages automatically via GitHub Actions on push to `main`.

### Testing tools

The Stats page currently has a small "Testing tools" row (seed fake data / clear all data), meant for trying out features like the swipe views without waiting on real data. It's safe to delete once no longer needed — just remove the `testingTools` block in `src/StatsView.tsx`.
