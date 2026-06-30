FROM node:22-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/ .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
ENV PUBLIC_API_URL=
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=backend-builder /app/backend ./backend
COPY --from=frontend-builder /app/frontend ./frontend

RUN npm install -g concurrently

EXPOSE 5000 4321

CMD ["concurrently", "npm --prefix backend run dev", "sh -c \"HOST=0.0.0.0 PORT=4321 node frontend/dist/server/entry.mjs\""]
