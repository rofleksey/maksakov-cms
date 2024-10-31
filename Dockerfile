# Creating multi-stage build for production
FROM node:18-alpine3.18 as build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm install -g node-gyp
RUN npm install --only=production
ENV PATH /opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN npm run build

# Creating final production image
FROM node:18-alpine3.18
RUN apk add --no-cache vips-dev curl
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY . .
COPY --from=build /opt/app ./
ENV PATH /opt/node_modules/.bin:$PATH
EXPOSE 1337
CMD ["npm", "run", "start"]
