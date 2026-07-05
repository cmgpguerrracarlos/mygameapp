# Random Name Tournament

Simple tournament game built with plain HTML, CSS, and JavaScript.

## Features

- Supports brackets of 2, 4, 8, or 16 players.
- Randomly shuffles the names into the bracket.
- Simulates each match step by step.
- Advances through the full tournament until the end.
- Shows champion, runner-up, and third place.

## Project structure

- `site/index.html`: main interface
- `site/styles.css`: UI styles
- `site/script.js`: tournament logic
- `site/404.html`: static 404 page

## Local development

```bash
npm run dev
```

Then open the local URL shown by Wrangler.

## Quick check

```bash
npm run check
```

## Deploy to Cloudflare

```bash
npm run deploy
```

This project uses Cloudflare Workers static assets with `site/` as the published directory.
