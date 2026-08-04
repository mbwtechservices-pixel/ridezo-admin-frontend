# Ridezo Admin

Standalone admin dashboard for Ridezo operations.

## Setup

```bash
npm install
cp .env.example .env.local
```

## Development

```bash
npm run dev
```

Open http://localhost:5175 — login with `admin@ridezo.com` / `Admin@123`.

## Vercel

This repo root **is** the app (`index.html` lives here). In Vercel project settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | *(leave empty)* |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

Environment variables (Production):

```
VITE_API_BASE_URL=https://ridezo-backend.onrender.com/api/v1
VITE_SOCKET_URL=https://ridezo-backend.onrender.com
VITE_APP_ENV=production
```

These are also in `.env.production` for local production builds.

If Root Directory is set to `src` or `admin`, the build fails with `Could not resolve entry module "index.html"`.

## Docker

```bash
npm run docker:build
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (port 5175) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run docker:build` | Build Docker image |

## Structure

```
admin/
├── packages/    # Local types, utils, ui, config
├── src/         # React app source
├── docker/      # Dockerfile + Nginx SPA config
└── public/
```
