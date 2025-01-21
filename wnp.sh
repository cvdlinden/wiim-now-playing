#!/usr/bin/env bash

# a helper script to pull the latest code from github and run w-n-p

if ! command -v docker-compose &> /dev/null; then
  echo "Error: docker-compose command not found. Please install Docker Compose."
fi
  
# build updated container from github
docker-compose build --no-cache

# stop the service (if running) and restart the service
docker-compose down
docker-compose up -d

echo "Clean up dangling images with docker-compose image prune"
# docker-compose image prune -f
