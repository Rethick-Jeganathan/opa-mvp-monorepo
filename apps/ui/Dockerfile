# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Build
COPY . .
RUN npm run build

# Run
EXPOSE 7200
ENV NODE_ENV=production
ENV PORT=7200
CMD ["npm", "run", "start"]
