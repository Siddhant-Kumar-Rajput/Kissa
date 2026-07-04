# --- Build Stage: installs ALL deps (including devDeps) to compile the client ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install backend dependencies (production only)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Install ALL client deps (devDeps needed for Vite build) then build
COPY client/package.json client/package-lock.json* ./client/
RUN npm ci --prefix client
COPY client/ ./client/
RUN npm run build --prefix client

# Copy backend source files
COPY server.js rateLimiter.js ./

# --- Production Stage: only the runtime artifacts ---
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy backend source
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/rateLimiter.js ./rateLimiter.js

# Copy compiled React client bundle
COPY --from=builder /app/client/dist ./client/dist

# Cloud Run sets PORT=8080; our server.js reads process.env.PORT
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.js"]
