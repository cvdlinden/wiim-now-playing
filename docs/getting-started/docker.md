# Docker

"I want to use Docker and run it virtually!"

> [!IMPORTANT]
> Please note that Docker images will **only** run well on a Linux machine. The Windows version of Docker does not support device discovery over SSDP and thus will not scan the network for WiiM devices. You may need to spin up an entire Linux VM for this to work, which defeats the purpose of Docker.  
> See: <https://github.com/cvdlinden/wiim-now-playing/pull/4>

## Use a ready made Docker image

Do have a look at [apwiggins/wiimnowplaying at Docker Hub](https://hub.docker.com/r/apwiggins/wiimnowplaying) for a ready built, up to date, Docker Container Image.

It is updated with each new release of the app.

## Creating a docker image

If you want to go at it yourself and use [Docker](https://www.docker.com/) instead of 'bare metal' on a Raspberry Pi, please refer to the docker folder in this repo.

The configuration is in ```docker-compose.yml```:

```yaml
---
services:
  wnp:
    image: apwiggins/wiimnowplaying:latest #use tag like v1.6.3 for specific version
    container_name: wnp
    network_mode: host # for SSDP discovery
    environment:
      - PORT=80 # defaults to port 80 unless PORT is set
                # now runs rootless with a non-priviledged user,
                # so no need to run on a high port
    restart: unless-stopped
    volumes:
      - wnp-data:/app/data

volumes:
  wnp-data:
```

```shell
# Run Docker container
docker compose up
```

## I want to run the dev container

use `./docker-build-run.sh`
