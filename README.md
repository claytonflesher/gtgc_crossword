# GTGC Bingo

Standalone React bingo app for Vercel or Netlify. The card is generated client-side from the entry pool in `src/bingoData.js`.

## Local development

1. Use Node `24`:
   `nvm use`
2. Install dependencies:
   `npm install`
3. Start the local dev server:
   `npm run dev`
4. Open the local site at `http://localhost:5173`

If the local dev server picks another port, use the URL Vite prints in the terminal.

If you do not use `nvm`, install Node `24` with Homebrew:

1. `brew install node@24`
2. `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`
3. `node -v`

## Content updates

- Edit `src/bingoData.js` to change the title, free-space text, or entry pool.

## Deploy

- Vercel: import the repo and deploy with the default settings
- Netlify: build command `npm run build`, publish directory `dist`
