FROM caddy:alpine
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY jekyll_build /srv
RUN rm -rf /srv/.git /srv/.nojekyll

# use supervisor to monitor the caddy daemon
RUN apk add --update supervisor && rm  -rf /tmp/* /var/cache/apk/*
COPY docker/supervisord.conf /etc/

ENTRYPOINT ["supervisord", "-c", "/etc/supervisord.conf"]
