# Watch Party MVP

Modern full-stack Watch Party MVP using YouTube embeds (no movie hosting or piracy functionality).

## Tech Stack

- Frontend: Next.js 15, React, TypeScript, TailwindCSS, Socket.IO Client
- Backend: Node.js, Express, TypeScript, Socket.IO
- Deploy targets: Vercel (frontend), Railway or Render (backend)

## Project Structure

```text
watchparty/
  backend/
    src/
      routes/
        health.ts
      services/
        roomManager.ts
      sockets/
        index.ts
      types/
        socket.ts
      utils/
        validation.ts
      app.ts
      server.ts
    .env.example
    package.json
    tsconfig.json
  frontend/
    app/
      api/health/route.ts
      room/[roomId]/page.tsx
      globals.css
      layout.tsx
      page.tsx
    components/
      ChatPanel.tsx
      JoinRoomForm.tsx
      RoomHeader.tsx
      UserList.tsx
      VideoPlayer.tsx
    hooks/
      useRoomSocket.ts
    lib/
      socket.ts
    types/
      index.ts
    .env.example
    next.config.ts
    package.json
    postcss.config.js
    tailwind.config.ts
    tsconfig.json
  .gitignore
  package.json
```

## Realtime Events

- `join_room`
- `leave_room`
- `sync_state`
- `play_video`
- `pause_video`
- `seek_video`
- `send_message`
- `receive_message`
- `room_users`

## Architecture Decisions

- Room and host state are centralized in backend `roomManager` for authoritative sync.
- Host-only media control prevents control conflicts.
- Playback drift correction runs periodically and also responds to pushed host state.
- Loop prevention uses sync suppression flags on the client.
- Typed payload contracts are shared conceptually across frontend/backend for safer realtime development.

## Local Setup

### 1) Prerequisites

- Node.js 20+ and npm

### 2) Install dependencies

From project root:

```bash
npm install
npm install --workspace backend
npm install --workspace frontend
```

### 3) Configure environment

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

### 4) Run in development

Option A (root script, runs both):

```bash
npm run dev
```

Option B (separate terminals):

```bash
# terminal 1
npm run dev --workspace backend

# terminal 2
npm run dev --workspace frontend
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:4000`

## Deployment

## Backend (Railway or Render)

1. Create new service from `backend/`.
2. Set build command: `npm install && npm run build`
3. Set start command: `npm run start`
4. Add env vars:
   - `PORT` (Railway/Render may provide this automatically)
   - `FRONTEND_ORIGIN=https://<your-vercel-domain>`
   https://watchparty-frontend-pi.vercel.app/
5. Deploy and copy backend URL.

## Frontend (Vercel)

1. Import repository in Vercel.
2. Set Root Directory to `frontend`.
3. Set env var:
   - `NEXT_PUBLIC_BACKEND_URL=https://<your-backend-domain>`
   https://watchparty-backend-production-bb5d.up.railway.app
4. Deploy.
5. Update backend `FRONTEND_ORIGIN` to include final Vercel domain if needed.

## MVP Feature Checklist

- Room create/join with shareable link
- Active user list with host label
- YouTube synced playback
- Experimental Vidking embed playback (event-based sync)
- Host play/pause/seek controls
- Drift correction and loop prevention
- Realtime room chat
- Toast notifications
- Reconnect/disconnect feedback
- Dark responsive UI
- Basic health endpoints
