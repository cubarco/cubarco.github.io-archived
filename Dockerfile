FROM caddy:alpine
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY . /srv
RUN rm -rf /srv/docker /srv/fly.toml /srv/Dockerfile /srv/.git /srv/.nojekyll

# use supervisor to monitor the caddy daemon
RUN apk add --update supervisor && rm  -rf /tmp/* /var/cache/apk/*
COPY docker/supervisord.conf /etc/

ENTRYPOINT ["supervisord", "-c", "/etc/supervisord.conf"]
