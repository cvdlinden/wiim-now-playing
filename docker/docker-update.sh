#!/usr/bin/env bash

# install jq and docker compose v2 to run this script

VERSION=$(jq -r '.version' ../package.json)
export $VERSION

# build updated container from github
$VERSION docker compose build --no-cache --force-recreate

# stop the service (if running) and restart the service
docker compose down
docker compose up

echo "Clean up dangling images with docker-compose image prune"
# docker compose image prune -f
