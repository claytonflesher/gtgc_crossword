# GTGC Bingo

Mintlify-based bingo page that generates a random 5x5 card from repo-backed entries in `snippets/bingo-data.jsx`.

## Local development

1. Use an LTS Node version supported by Mintlify:
   `nvm use`
2. Install dependencies:
   `npm install`
3. Start the local Mintlify preview:
   `npm run dev`
4. Open the local site at `http://localhost:3000`

Mintlify supports Node `20.17.0+`, but the CLI currently rejects Node `25+`. Use a current LTS release such as Node `22`.

If you do not use `nvm`, install Node `22` with Homebrew:

1. `brew install node@22`
2. `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`
3. `node -v`

## Content updates

- Edit `snippets/bingo-data.jsx` to change the title, free-space text, or entry pool.
- Replace the placeholder entries with your real GTGC bingo items.
