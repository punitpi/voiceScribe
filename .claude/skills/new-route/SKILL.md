---
name: new-route
description: Scaffold a new Express API route with controller and service file following VoiceScribe conventions
---

Create three files following the existing patterns in backend/src/:

1. `backend/src/routes/<name>.ts` — Express Router with RESTful endpoints (see recordings.ts for pattern)
2. `backend/src/controllers/<name>Controller.ts` — Request/response handling, calls service layer
3. `backend/src/services/<name>Service.ts` — Business logic, SQLite queries

Then register the route in `backend/src/server.ts` alongside the existing routes.

Ask the user for the route name and what resources/operations it should expose before generating code.
