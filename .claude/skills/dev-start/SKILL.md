---
name: dev-start
description: Kill ports 3001/5173 and start VoiceScribe dev servers (backend + frontend)
disable-model-invocation: true
---

Run the following to start the dev environment:

```bash
npm run kill-ports && npm run dev
```

Backend runs on port 3001 (Express + Socket.io), frontend on port 5173 (Vite).
