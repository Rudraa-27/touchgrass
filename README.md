# TouchGrass

TouchGrass is a gentle companion for getting outside: choose the kind of place
you're heading to, your available time, energy, and social comfort, then get
three optional quests to help notice, connect, move, or play.

TouchGrass has no accounts, streaks, leaderboards, or cloud sync. Quest
completions, points, skills, badges, saved quests, and private outing notes are
kept in browser storage on the current device. Nothing is submitted to MongoDB.

The app is an installable PWA. Once it has been opened online, its app shell and
curated quest packs remain available offline. When online, the app tries the
local Ollama model first; if the API or model is unavailable, it uses the
bundled quest pack instead. Offline quest generation uses curated content, not
an on-device language model. The first visit still requires a network
connection to load and cache the app. Use **Install this app** in the app header
when your browser offers installation. On iPhone or iPad, open the app in Safari,
tap **Share**, then choose **Add to Home Screen**.

## Run locally

1. Copy `Server/.env.example` to `Server/.env`, then start MongoDB.
2. Optionally run Ollama and pull a model, for example `ollama pull gemma4:latest`.
   Set `OLLAMA_MODEL` in `Server/.env` to a model installed in your Ollama.
3. In `Server/`, run `npm install` if needed, then `npm run dev`.
4. In `Client/`, run `npm install` and `npm run dev`.
5. Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

The Vite development server proxies `/api` requests to the Express API on port
5001. Quest generation uses Ollama with thinking disabled and a concise output
limit to reduce wait time. If Ollama is unavailable, the app falls back to the
selected curated pack. Service-worker caching is enabled for production builds;
use `npm run build` followed by `npm run preview` in `Client/` to try offline
mode locally. PWA installation and service workers require HTTPS in deployment
(localhost is allowed for development).

## Checks

- `cd Server && npm test`
- `cd Client && npm test`
- `cd Client && npm run build`
