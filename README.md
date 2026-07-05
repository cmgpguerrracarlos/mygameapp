## Bracket Blitz

Mobile-first anonymous tournament app built with Next.js App Router and TypeScript.

### Features

- Anonymous temporary sessions with HTTP-only cookies.
- 2, 4, 8, 16, or 32 competitor elimination brackets.
- Device photo uploads with temporary storage.
- Rating-influenced match simulation with step-by-step progression.
- Third-place playoff plus final podium screen.
- Automatic cleanup path for expired or ended sessions.

### Local development

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

The local runtime stores session JSON and uploaded images under `.data/`, and deletes them when a session ends or expires.

### Checks

```bash
npm run lint
npm run build
npm run build:next
```

### Cloudflare deployment

This project is wired for Cloudflare Workers using OpenNext.

1. Create one KV namespace for session records.
2. Create one R2 bucket for temporary competitor photos.
3. In the Cloudflare dashboard, add bindings with these exact names:
   `TOURNAMENT_SESSIONS_KV` for the KV namespace and `TOURNAMENT_UPLOADS` for the R2 bucket.
4. If you prefer managing bindings in code, add the real KV and R2 identifiers to `wrangler.jsonc`.
5. Optionally regenerate binding types with `npm run cf-typegen`.
6. For Cloudflare Workers Builds, use:

```bash
Build command: npm run build
Deploy command: npx wrangler deploy
```

7. For local or CI deploys, use:

```bash
npm run preview
npm run deploy
npm run build
npm run build:next
npm run build:cf
npm run preview:cf
npm run deploy:cf
```

### Notes

- In local Node development, storage falls back to the filesystem.
- In Cloudflare, the app automatically uses `TOURNAMENT_SESSIONS_KV` and `TOURNAMENT_UPLOADS`.
- `wrangler.jsonc` intentionally does not ship placeholder KV/R2 IDs, because fake resource names make Cloudflare deploys fail before the Worker is published.
- The Worker deploy uses `nodejs_compat` because the OpenNext server bundle still imports Node built-ins at runtime.
- The installed `wrangler` version expects Node 22+, so use Node 22 in CI or on the machine that runs Cloudflare preview/deploy commands.
- `npm run build` now performs the OpenNext adapter build used by Cloudflare Workers.
- Use `npm run build:next` only when you specifically want a plain Next.js production build outside the Cloudflare deployment path.

### Reference

- Cloudflare Workers Next.js guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare Pages Next.js overview: https://developers.cloudflare.com/pages/framework-guides/nextjs/
