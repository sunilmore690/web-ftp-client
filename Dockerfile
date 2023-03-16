
FROM node:6.10-alpine
RUN apk update && \
    apk upgrade 
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install --silent
COPY . /usr/src/app
#RUN node_modules/grunt-cli/bin/grunt
#RUN cd stakenote-ui && npm run build
EXPOSE 4000
CMD npm start