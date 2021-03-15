FROM alpine:3.13 as py-ea
# Latest version on 2021-02-11
ARG ELASTALERT_VERSION=1dc4f30f30d39a689f419ce19c7e2e4d67a50be3 
ENV ELASTALERT_VERSION=${ELASTALERT_VERSION}
# URL from which to download Elastalert.
ARG ELASTALERT_URL=https://github.com/Yelp/elastalert/archive/$ELASTALERT_VERSION.zip
ENV ELASTALERT_URL=${ELASTALERT_URL}
# Elastalert home directory full path.
ENV ELASTALERT_HOME /opt/elastalert

WORKDIR /opt

RUN apk add --update --no-cache cargo ca-certificates openssl-dev openssl python3-dev python3 py3-pip py3-yaml libffi-dev gcc musl-dev wget && \
    pip3 install --upgrade pip && \
    pip3 install cryptography && \
    # Download and unpack Elastalert.
    wget -O elastalert.zip "${ELASTALERT_URL}" && \
    unzip elastalert.zip && \
    rm elastalert.zip && \
    mv e* "${ELASTALERT_HOME}"

WORKDIR "${ELASTALERT_HOME}"

# Install Elastalert.
RUN python3 setup.py install

FROM node:14-alpine
LABEL maintainer="Karql <karql.pl@gmail.com>"
# Set timezone for this container
ENV TZ Etc/UTC

RUN apk add --update --no-cache curl tzdata python3 make libmagic && \
    ln -s /usr/bin/python3 /usr/bin/python

COPY --from=py-ea /usr/lib/python3.8/site-packages /usr/lib/python3.8/site-packages
COPY --from=py-ea /opt/elastalert /opt/elastalert
COPY --from=py-ea /usr/bin/elastalert* /usr/bin/

WORKDIR /opt/elastalert-server
COPY . /opt/elastalert-server

RUN npm install --production --quiet
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
