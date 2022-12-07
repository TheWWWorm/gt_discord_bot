# Stage 1
FROM node:16 as node

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN npm install -g ts-node
RUN npm install -g pm2
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# From here we load our application's code in, therefore the previous docker
# "layer" thats been cached will be used if possible
WORKDIR /opt/app
COPY . /opt/app
WORKDIR /opt/app

RUN npm run tsc
# RUN npm run pm2
CMD ["pm2-runtime", "index.js"]