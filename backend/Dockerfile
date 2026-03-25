FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---

FROM node:20-alpine AS runner

# ffmpeg is bundled via @ffmpeg-installer/ffmpeg (no system ffmpeg needed)
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Persistent volumes mounted at runtime
RUN mkdir -p data uploads/audio uploads/pdfs

EXPOSE 3001

CMD ["node", "dist/server.js"]
