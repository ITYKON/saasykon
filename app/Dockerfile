# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder
WORKDIR /app

# Définir les variables de build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copier le reste du code
COPY . .


# Generer le client prisma: ahlem
RUN npx prisma generate

# pour regler le prb des var d env: ahlem
COPY .env.mock ./.env.production

# Build Next.js
RUN npm run build

# Image de production
FROM node:18-alpine
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copier les fichiers buildés
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Donner les bonnes permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "server.js"]