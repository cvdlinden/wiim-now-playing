#!/usr/bin/env bash

DEV=dev-docker-compose.yml

# install jq and docker compose v2 to run this script

docker stop wnp && docker image rm docker-wnp:latest --force

# build updated container from github
docker compose -f $DEV build --no-cache --build-arg VERSION=v$(jq -r '.version' ../package.json)

# stop the service (if running) and restart the service
docker compose -f $DEV down
docker compose -f $DEV up

echo "Clean up dangling images with docker-compose image prune"
# docker compose image prune -f
