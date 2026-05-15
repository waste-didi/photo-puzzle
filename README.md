# Photo Puzzle

A mobile-friendly web puzzle game that turns an uploaded photo into a tile puzzle.

## Features

- Upload or drag in a photo
- Local-only image processing in the browser
- Center-cropped square puzzle image to avoid stretching
- 3x3, 4x4, and 5x5 difficulty
- Adjacent-tile swaps only
- Solvable shuffles generated from legal moves
- Move counter, timer, preview, and win state

## Run Locally

```sh
python3 -m http.server 4173
```

Then open:

```txt
http://127.0.0.1:4173/
```

## Deploy

This is a static site, so it can be hosted on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any ordinary static file server.
