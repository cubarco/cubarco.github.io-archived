FROM caddy:alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY . /srv
RUN rm -rf /srv/Caddyfile /srv/fly.toml /srv/Dockerfile /srv/.git
