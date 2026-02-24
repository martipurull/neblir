# Neblir

Neblir is a Next.js app for a homebrewed sci-fi TTRPG.

## Getting Started

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## PWA Setup

The app is configured as a Progressive Web App with:

- `next-pwa` service worker generation during production build
- App Router manifest route at `src/app/manifest.ts`
- Offline fallback page at `src/app/offline/page.tsx`
- Install icons under `public/icons`

### Local PWA testing

Service workers are disabled in development and enabled in production mode:

```bash
npm run build
npm run start
```

Then open `http://localhost:3000` and verify:

- DevTools > Application > Manifest shows app metadata and icons
- DevTools > Application > Service Workers shows an active worker
- Install prompt is available (or browser install menu entry)

### Production HTTPS (Vercel)

PWA installability requires HTTPS. Vercel automatically serves production traffic over HTTPS for both project domains and connected custom domains.

## Regression Checklist

Use this checklist before shipping UI or PWA changes.

### Desktop browser mode (normal tab)

- Sign in succeeds and redirects to dashboard
- Sign out succeeds and redirects back to home
- Dashboard sections render as expected
- Keyboard focus states are visible on interactive controls

### Desktop installed app mode (standalone window)

- App can be installed from browser UI
- Installed app launches without browser chrome
- Sign in and sign out still work
- Route navigation and page refresh work as expected

### Offline and weak network behavior

- With network throttled or offline, previously visited screens still render from cache
- Offline fallback page appears for uncached routes
- Returning online restores fresh network data

### Data integrity guardrails

- GET endpoints can be served from cache during poor signal
- Mutation routes (`POST`, `PUT`, `PATCH`, `DELETE`) are never cached
