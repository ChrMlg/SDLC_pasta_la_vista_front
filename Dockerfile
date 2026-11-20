FROM node:22-alpine AS build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend/tsconfig.json tsconfig.json
COPY frontend/vite.config.ts vite.config.ts
COPY frontend/index.html index.html
COPY frontend/src src
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
