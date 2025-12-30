# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder
WORKDIR /app

# Variables de build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copier + installer dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copier code
COPY . .

# ✅ GÉNÉRER PRISMA POUR LE BUILD (avec une URL factice)
RUN DATABASE_URL="postgresql://fake:fake@localhost:5432/fake" npx prisma generate

# Build Next.js (nécessite Prisma Client)
RUN npm run build

# Image production
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Installer Prisma CLI pour regénération au runtime
RUN npm install -g prisma

# Utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copier tout ce qui est nécessaire
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

USER nextjs
EXPOSE 3000

# REGÉNÉRER PRISMA AU DEMARRAGE avec la VRAIE DATABASE_URL
CMD ["sh", "-c", "npx prisma generate && node server.js"]