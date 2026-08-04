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
