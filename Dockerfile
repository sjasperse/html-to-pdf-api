FROM ubuntu:16.04 AS font-collector

RUN apt-get update \
  && apt-get install -y apt-utils fontconfig apt-transport-https \
  && rm -rf /var/lib/update-notifier/package-data-downloads/partial/* \
  && echo "yes" | apt-get install -y ttf-mscorefonts-installer


FROM node:8.1.3

RUN mkdir -p /usr/share/fonts/truetype/msttcorefonts/
COPY --from=font-collector /usr/share/fonts/truetype/msttcorefonts/* /usr/share/fonts/truetype/msttcorefonts/
RUN fc-cache

RUN mkdir /app
WORKDIR /app/

# do just the package.json and package restore first so if there
# are no changes the docker build process can use the cached version
COPY package.json ./package.json
RUN npm install

COPY src/* ./

ENV TEMP_DIR="/tmp/html-to-pdf/"
RUN mkdir -p $TEMP_DIR

ENTRYPOINT [ "node", "index.js" ]

EXPOSE 3000

