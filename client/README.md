# Lattice — Client

The frontend for Lattice. A Next.js 16 application that lets developers publish and browse project portfolios.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios (with `withCredentials: true` for cross-domain cookies) |
| Icons | Lucide React |
| Runtime | React 19 |

## Project structure

```
client/
├── app/
│   ├── page.tsx                  # Home feed — browse all projects
│   ├── layout.tsx                # Root layout
│   └── profile/[userId]/         # Public profile page for any user
├── components/
│   ├── header.tsx                # Top navigation bar
│   ├── auth-modal.tsx            # Login / signup modal
│   ├── project-card.tsx          # Project tile shown in the feed
│   ├── project-detail-modal.tsx  # Full project detail overlay
│   ├── project-manage-modal.tsx  # Create / edit project form
│   └── public-profile-modal.tsx  # Quick profile view
├── context/                      # React context providers
├── lib/
│   ├── api.ts                    # Axios client + all typed API calls
│   ├── profile-cache.ts          # In-memory cache for public profiles
│   └── profile-details.ts        # Profile data fetching helpers
└── public/                       # Static assets
```

## Environment variables

Create a `.env.local` file in this directory (or set in the Vercel dashboard):

```env
NEXT_PUBLIC_API_URL=https://lattice.onrender.com
```

This variable **must** be prefixed with `NEXT_PUBLIC_` so Next.js can use it when proxying `/api/*` requests to the backend. Without it the app falls back to `http://localhost:8080` for local development.

## Running locally

```bash
# Install dependencies
npm install
# or
bun install

# Start the dev server
npm run dev
# or
bun dev
```

App runs at `http://localhost:3000`.

> Make sure the backend server is also running (see `server/readme.md`) or point `NEXT_PUBLIC_API_URL` at the backend you want Next.js to proxy to.

## Building for production

```bash
npm run build
npm run start
```

## Deployment

Deployed on **Vercel** at `https://latticegoproject.vercel.app`.

Add the following in **Vercel → Project Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL = https://lattice.onrender.com
```

> `.env.local` is gitignored and will not be picked up by Vercel automatically — you must add the variable through the dashboard.
