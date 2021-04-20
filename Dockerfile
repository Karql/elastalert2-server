FROM alpine:3.14 as py-ea
ARG ELASTALERT_VERSION=2.2.1 
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

FROM node:14-alpine3.14
LABEL maintainer="Karql <karql.pl@gmail.com>"
# Set timezone for this container
ENV TZ Etc/UTC

RUN apk add --update --no-cache curl tzdata python3 make libmagic && \
    ln -s /usr/bin/python3 /usr/bin/python

COPY --from=py-ea /usr/lib/python3.9/site-packages /usr/lib/python3.9/site-packages
COPY --from=py-ea /opt/elastalert /opt/elastalert
COPY --from=py-ea /usr/bin/elastalert* /usr/bin/

WORKDIR /opt/elastalert-server

COPY package*.json /opt/elastalert-server
RUN npm ci

COPY . /opt/elastalert-server
RUN npm run build

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
