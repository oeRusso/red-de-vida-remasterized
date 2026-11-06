# Imagen de producción (Next.js standalone) y, aparte, una imagen de herramientas para
# seed e índices. La usa ../compose.yaml; ver docs/despliegue.md.

FROM node:24-alpine AS deps
WORKDIR /app
# mongodb-memory-server solo sirve para los tests: que no descargue mongod al instalar.
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# docker compose run --rm tools npm run db:indexes -- --prod
FROM deps AS tools
COPY . .
CMD ["npm", "run", "db:indexes", "--", "--prod"]

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/institutions').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "server.js"]
