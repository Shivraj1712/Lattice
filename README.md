# Lattice

Lattice is a full-stack project showcase platform where developers can sign up, publish their projects, and browse work shared by others. It is built as a monorepo with a Go backend and a Next.js frontend, deployed separately.

## What it does

- Users create an account with email/password or sign in via Google OAuth
- Each user gets a profile page listing all the projects they have published
- Projects include a title, description, category, GitHub link, live demo link, and a cover image
- Anyone can browse all published projects without logging in
- Authenticated users can create, update, and delete their own projects
- Public profiles can be viewed by anyone — useful for sharing your portfolio

## Repository structure

```
Lattice/
├── server/    # Go + Fiber REST API (deployed on Render)
└── client/    # Next.js 16 frontend (deployed on Vercel)
```

See each subdirectory's own README for setup and deployment details.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Go, Fiber v2, GORM, PostgreSQL (Neon), Redis (Upstash) |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Axios |
| Auth | Local (bcrypt) + Google OAuth via Goth |
| Media | Cloudinary |
| API Docs | Swagger (swaggo) |

## Live deployment

| Service | URL |
|---|---|
| Frontend | https://latticegoproject.vercel.app |
| Backend API | https://lattice.onrender.com |
| Swagger docs | https://lattice.onrender.com/swagger/ |