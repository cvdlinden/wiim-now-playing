# Docker

## I just want to run the docker image

use `docker-compose.yml`

run `docker compose up`

```yaml
services:
  wnp:
    image: apwiggins/wiimnowplaying:latest #use tag like v1.6.3 for specific version
    container_name: wnp
    network_mode: host # for SSDP discovery
    environment:
      - PORT=80        # defaults to port 80 unless PORT is set
                       # now runs rootless with a non-privileged user
    restart: unless-stopped
    volumes:
      - wnp-data:/app/data
```


## I want to run the dev container

use `./docker-build-run.sh`
