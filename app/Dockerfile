# syntax=docker/dockerfile:1

# ------------------------------
# Base image
# ------------------------------
FROM node:18-alpine AS base
WORKDIR /app

# Install compatibility libraries
RUN apk add --no-cache libc6-compat bash git

# ------------------------------
# Install dependencies
# ------------------------------
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* .npmrc* ./

# Install dependencies
RUN if [ -f package-lock.json ]; then \
        npm install --legacy-peer-deps; \
    else \
        echo "Lockfile not found." && exit 1; \
    fi

# ------------------------------
# Build the Next.js app
# ------------------------------
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .

# Build Next.js app
RUN npm run build

# ------------------------------
# Production image
# ------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy built app and static assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Run server
CMD ["node", "server.js"]
