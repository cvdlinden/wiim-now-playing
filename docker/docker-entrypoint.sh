#!/bin/sh
set -e

echo "--------------------------"
echo "WNP version: ${VERSION:-Unknown}"
echo "Node version: $(node -v)"
echo "Listening on port: ${PORT:-80}"
echo "non-privileged user: $(id -u)"
echo "Data directory: /app/data (ensure this is mounted as a volume for persistence)"
echo "--------------------------"
echo
echo "--------------------------"

# # Execute the CMD from Dockerfile
cd /app

if [ "$1" = "" ]; then
    exec CMD node server/index.js
else
    exec "$@"
fi