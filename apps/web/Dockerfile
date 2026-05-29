FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S geotech && adduser -S geotech -G geotech

# Standalone monorepo output: server.js lives at apps/web/ within the standalone tree
COPY .next/standalone ./
COPY .next/static ./apps/web/.next/static
COPY public ./apps/web/public

USER geotech
EXPOSE 3000
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app/apps/web
CMD ["node", "server.js"]
