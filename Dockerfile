FROM alpine:3.21 as build-elastalert
ARG ELASTALERT_VERSION=2.24.0
ENV ELASTALERT_VERSION=${ELASTALERT_VERSION}
# URL from which to download ElastAlert 2
ARG ELASTALERT_URL=https://github.com/jertel/elastalert2/archive/refs/tags/$ELASTALERT_VERSION.zip
ENV ELASTALERT_URL=${ELASTALERT_URL}
# ElastAlert 2 home directory full path
ENV ELASTALERT_HOME /opt/elastalert

WORKDIR /opt

RUN apk add --update --no-cache \
    python3 \
    py3-pip \
    py3-setuptools \
    py3-wheel \
    wget && \
    # Download and unpack ElastAlert 2
    wget -O elastalert.zip "${ELASTALERT_URL}" && \
    unzip elastalert.zip && \
    rm elastalert.zip && \
    mv e* "${ELASTALERT_HOME}"

WORKDIR "${ELASTALERT_HOME}"

# Building ElastAlert 2
RUN python3 setup.py sdist bdist_wheel

# Installing ElastAlert 2 in Virtual Environment
RUN python3 -m venv /opt/elastalert2-venv && \
    . /opt/elastalert2-venv/bin/activate && \
    pip3 install dist/*.tar.gz && \
    deactivate

FROM node:22.15-alpine3.21 as build-server

WORKDIR /opt/elastalert-server

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22.15-alpine3.21

LABEL description="ElastAlert2 Server"
LABEL maintainer="Karql <karql.pl@gmail.com>"

# Set timezone for this container
ENV TZ Etc/UTC

RUN apk add --update --no-cache tzdata python3

COPY --from=build-elastalert /opt/elastalert2-venv/lib/python3.12/site-packages /usr/lib/python3.12/site-packages
COPY --from=build-elastalert /opt/elastalert2-venv/bin/elastalert* /usr/bin/
RUN mkdir -p /opt/elastalert

COPY --from=build-server /opt/elastalert-server/dist /opt/elastalert-server/dist

WORKDIR /opt/elastalert-server

COPY package*.json ./
RUN npm ci --omit=dev

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
CMD ["node", "dist/index.js"]
