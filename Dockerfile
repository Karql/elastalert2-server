FROM alpine:3.16 as build-elastalert
ARG ELASTALERT_VERSION=2.5.1
ENV ELASTALERT_VERSION=${ELASTALERT_VERSION}
# URL from which to download ElastAlert 2.
ARG ELASTALERT_URL=https://github.com/jertel/elastalert2/archive/refs/tags/$ELASTALERT_VERSION.zip
ENV ELASTALERT_URL=${ELASTALERT_URL}
# ElastAlert 2 home directory full path.
ENV ELASTALERT_HOME /opt/elastalert

WORKDIR /opt

RUN apk add --update --no-cache \
    cargo ca-certificates \
    openssl-dev \
    openssl \
    python3-dev \
    python3 \
    py3-pip \
    py3-wheel \
    py3-yaml \
    libffi-dev \
    gcc \
    musl-dev \
    wget && \
    pip3 install --upgrade pip && \
    pip3 install cryptography && \
    # Download and unpack ElastAlert 2.
    wget -O elastalert.zip "${ELASTALERT_URL}" && \
    unzip elastalert.zip && \
    rm elastalert.zip && \
    mv e* "${ELASTALERT_HOME}"

WORKDIR "${ELASTALERT_HOME}"

# Install ElastAlert 2.
RUN python3 setup.py install

FROM node:16.15-alpine3.16 as build-server

WORKDIR /opt/elastalert-server

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:16.15-alpine3.16

LABEL description="ElastAlert2 Server"
LABEL maintainer="Karql <karql.pl@gmail.com>"

# Set timezone for this container
ENV TZ Etc/UTC

RUN apk add --update --no-cache curl tzdata python3 make libmagic && \
    ln -s /usr/bin/python3 /usr/bin/python

COPY --from=build-elastalert /usr/lib/python3.10/site-packages /usr/lib/python3.10/site-packages
COPY --from=build-elastalert /opt/elastalert /opt/elastalert
COPY --from=build-elastalert /usr/bin/elastalert* /usr/bin/

COPY --from=build-server /opt/elastalert-server/dist /opt/elastalert-server/dist

WORKDIR /opt/elastalert-server

COPY package*.json ./
RUN npm ci --production

COPY scripts scripts

COPY config/elastalert.yaml /opt/elastalert/config.yaml
COPY config/elastalert-test.yaml /opt/elastalert/config-test.yaml
COPY config/config.json config/config.json
COPY rule_templates/ /opt/elastalert/rule_templates
COPY elastalert_modules/ /opt/elastalert/elastalert_modules

# Add default rules directory
# Set permission as unpriviledged user (1000:1000), compatible with Kubernetes
RUN mkdir -p /opt/elastalert/rules/ /opt/elastalert/server_data/tests/ \
    && chown -R node:node /opt

USER node

EXPOSE 3030
ENTRYPOINT ["npm", "start"]
