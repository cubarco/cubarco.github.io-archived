#!/usr/bin/env bash

curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$APPID/purge_cache" \
-H "X-Auth-Email: marco.l.here@gmail.com" \
-H "X-Auth-Key: $XAUTHKEY" \
-H "Content-Type: application/json" \
--data '{"purge_everything":true}'
