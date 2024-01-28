# Setting up a Raspberry Pi Kiosk mode

I.e. start a Raspberry Pi with Chromium fullscreen on the local (DSI) display to show the app. Nothing else.

TO READ:

Chromium-browser in Kiosk mode:

- <https://github.com/guysoft/FullPageOS>
- <https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/>
- <https://reelyactive.github.io/diy/pi-kiosk/>

Node.js on Raspberry Pi OS (Bullseye):

- <https://pimylifeup.com/raspberry-pi-nodejs/>
- <https://deb.nodesource.com/>
- In case signing does not work, make sure the keyrings folder is present:  
  ``> sudo mkdir /etc/apt/keyrings | sudo chmod 755 /etc/apt/keyrings``
- In order to claim port 80 (default www) as a non-root (sudo) user:

  ```shell
  > sudo apt-get install libcap2-bin 
  > sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
  ```

??? Use crontab to auto-start node?

```shell
> sudo crontab -e

# Start node on (re)boot
> @reboot sudo /usr/bin/node /home/pi/www/index.js &
```
