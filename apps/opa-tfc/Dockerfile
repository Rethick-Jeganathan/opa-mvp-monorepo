# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY index.js ./index.js
COPY data ./data

EXPOSE 9300
CMD ["npm", "start"]
