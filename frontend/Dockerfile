FROM node:22-alpine AS deps 
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS build
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app . . 
RUN npm run build


FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/package*.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["npm", "run", "start"]