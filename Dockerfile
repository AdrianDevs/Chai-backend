#Build stage
FROM node:current-alpine AS build
WORKDIR /home/node/app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

#Production stage
FROM node:current-alpine AS prod
WORKDIR /home/node/app
COPY package*.json .
COPY ./keys ./keys
RUN npm ci --only=production
COPY --from=build /home/node/app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]