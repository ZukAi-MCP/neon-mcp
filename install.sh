#!/bin/sh
set -ex
# Install script for web based service
# Copyright 2018 Jamie Lentin (jamie.lentin@shuttlethread.com)

# This script will create a systemd unit for running the backend, and
# an nginx config.
#
# It is tested on Debian, but should hopefully work on anything systemd-based.

# ---------------------------
# Config options, to override any of these, set them in .local.conf

[ -e ".local-conf" ] && . ./.local-conf
PROJECT_PATH="${PROJECT_PATH-$(dirname "$(readlink -f "$0")")}"  # The full project path, e.g. /srv/tutor-web.beta
PROJECT_NAME="${PROJECT_NAME-$(basename ${PROJECT_PATH})}"  # The project directory name, e.g. tutor-web.beta
PROJECT_MODE="${PROJECT_MODE-development}"  # The project mode, development or production
PROJECT_VARS="PROJECT_|^WWW_|^BACKEND_|^BITCOIND_|^INSIGHT_"

WWW_SERVER_NAME="${WWW_SERVER_NAME-$(hostname --fqdn)}"  # The server_name(s) NGINX responds to
WWW_CERT_PATH="${WWW_CERT_PATH-}"  # e.g. /etc/nginx/ssl/certs
if [ "${PROJECT_MODE}" = "production" ]; then
    # Default to nobody
    BACKEND_USER="${BACKEND_USER-nobody}"
    BACKEND_GROUP="${BACKEND_GROUP-nogroup}"
else
    # Default to user that checked out code (i.e the developer)
    BACKEND_USER="${BACKEND_USER-$(stat -c '%U' ${PROJECT_PATH}/.git)}"
    BACKEND_GROUP="${BACKEND_GROUP-$(stat -c '%U' ${PROJECT_PATH}/.git)}"
fi
BACKEND_MAILSENDER="${BACKEND_MAILSENDER-noreply@$WWW_SERVER_NAME}"

INSIGHT_PORT="${INSIGHT_PORT-3000}"
INSIGHT_NETWORK="${INSIGHT_NETWORK-livenet}"
INSIGHT_DB="${INSIGHT_DB-${PROJECT_PATH}/.insight}"
INSIGHT_PEERDB="${INSIGHT_PEERDB-${PROJECT_PATH}/peerdb.json}"

set | grep -E "${PROJECT_VARS}"

# If just used to execute a server (in development mode, e.g.) do that
[ $1 = '--exec' ] && { shift; exec $*; }

# ---------------------------
# Systemd unit file to run backend
set | grep -E "${PROJECT_VARS}" > "/etc/systemd/system/${PROJECT_NAME}.env"
chmod 600 -- "/etc/systemd/system/${PROJECT_NAME}.env"

# Create a home directory for app to use
mkdir -p -- "${INSIGHT_DB}"
chown -R ${BACKEND_USER}:${BACKEND_GROUP} -- "${INSIGHT_DB}"

touch -- "${INSIGHT_PEERDB}"
chown ${BACKEND_USER}:${BACKEND_GROUP} -- "${INSIGHT_PEERDB}"

systemctl | grep -q "${PROJECT_NAME}.service" && systemctl stop ${PROJECT_NAME}.service
cat <<EOF > /etc/systemd/system/${PROJECT_NAME}.service
[Unit]
Description=Backend daemon for ${PROJECT_NAME}
After=network.target

[Service]
ExecStart=${PROJECT_PATH}/n/versions/node/0.10.48/bin/npm start
WorkingDirectory=${INSIGHT_DB}
EnvironmentFile=/etc/systemd/system/${PROJECT_NAME}.env
User=${BACKEND_USER}
Group=${BACKEND_GROUP}
Restart=on-failure
RestartSec=5s
Type=simple
StandardError=syslog
NotifyAccess=all

[Install]
WantedBy=multi-user.target
EOF

if [ "${PROJECT_MODE}" = "production" ]; then
    systemctl enable ${PROJECT_NAME}.service
    systemctl start ${PROJECT_NAME}.service
else
    systemctl disable ${PROJECT_NAME}.service
    systemctl stop ${PROJECT_NAME}.service
fi

# ---------------------------
# NGINX config for serving clientside
echo -n "" > /etc/nginx/sites-available/${PROJECT_NAME}

if [ -n "${WWW_CERT_PATH}" -a -e "${WWW_CERT_PATH}/certs/${WWW_SERVER_NAME}/fullchain.pem" ]; then
    # Generate full-blown SSL config
    cat <<EOF >> /etc/nginx/sites-available/${PROJECT_NAME}
server {
    listen      80;
    server_name ${WWW_SERVER_NAME};

    location /.well-known/acme-challenge/ {
        alias "${WWW_CERT_PATH}/acme-challenge/";
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen [::]:443 ssl;
    listen      443 ssl;
    server_name ${WWW_SERVER_NAME};

    ssl_certificate      ${WWW_CERT_PATH}/certs/${WWW_SERVER_NAME}/fullchain.pem;
    ssl_certificate_key  ${WWW_CERT_PATH}/certs/${WWW_SERVER_NAME}/privkey.pem;
    ssl_trusted_certificate ${WWW_CERT_PATH}/certs/${WWW_SERVER_NAME}/fullchain.pem;
    ssl_dhparam ${WWW_CERT_PATH}/dhparam.pem;

    # https://mozilla.github.io/server-side-tls/ssl-config-generator/
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    # intermediate configuration. tweak to your needs.
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:ECDHE-RSA-DES-CBC3-SHA:ECDHE-ECDSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:AES:CAMELLIA:DES-CBC3-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aECDH:!EDH-DSS-DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!KRB5-DES-CBC3-SHA';
    ssl_prefer_server_ciphers on;

EOF
elif [ -n "${WWW_CERT_PATH}" ]; then
    # HTTP only, but add acme-challenge section for bootstrapping
    cat <<EOF >> /etc/nginx/sites-available/${PROJECT_NAME}
server {
    listen      80;
    server_name ${WWW_SERVER_NAME};

    location /.well-known/acme-challenge/ {
        alias "${WWW_CERT_PATH}/acme-challenge/";
    }
EOF
else
    # HTTP only
    cat <<EOF >> /etc/nginx/sites-available/${PROJECT_NAME}
server {
    listen      80;
    server_name ${WWW_SERVER_NAME};
EOF
fi

cat <<EOF >> /etc/nginx/sites-available/${PROJECT_NAME}
    charset     utf-8;
    gzip        on;

    location / {
        proxy_pass  http://localhost:${INSIGHT_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade         \$http_upgrade;
        proxy_set_header Connection      "upgrade";
        proxy_set_header Host            \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
    }
}
EOF
ln -fs /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/${PROJECT_NAME}
nginx -t
systemctl reload nginx.service
