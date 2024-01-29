# Setting up a Raspberry Pi Kiosk mode

> Warning: [Goose chasing](https://www.urbandictionary.com/define.php?term=goose%20chase) ahead!!!

Goal: start a Raspberry Pi with Chromium in kiosk mode on the local (DSI) display to show the localhost app.

The 'works-on-my-machine' guide:

- Raspberry Pi OS Bullseye (legacy)
- The 'Lite' version with LXDE (see blockdev.io link)  
  Note: LightDM apparently does not like autologin and the Fat version is overkill.
- Whole lot of Googling to fix 'this-and-that'

## Chromium-browser in Kiosk mode

- Fat, Lite and Super Lite versions: <https://blockdev.io/raspberry-pi-2-and-3-chromium-in-kiosk-mode/>
- <https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/>
- <https://reelyactive.github.io/diy/pi-kiosk/>
- <https://github.com/guysoft/FullPageOS>

**Note!**: Switch to the legacy (Bullseye) version of Raspberry Pi OS if you can't get the touchscreen to work in the latest version (Bookworm).

## Node.js on Raspberry Pi OS (Bullseye)

Links:

- <https://deb.nodesource.com/>
- <https://pimylifeup.com/raspberry-pi-nodejs/>

### Additional info

Raspberry Pi OS installs an old version of NodeJS, without NPM. Check the above links for an updated version. At this time the LTS version is 20! With which this app was made.

In case signing does not work, make sure the keyrings folder is present:  
  ``sudo mkdir /etc/apt/keyrings | sudo chmod 755 /etc/apt/keyrings``

By default Debian does not like claiming port 80 as a non-root user.  
In order to claim port 80 (default www) as a non-root/sudo user, use ([found here](https://stackoverflow.com/questions/60372618/nodejs-listen-eacces-permission-denied-0-0-0-080)):

```shell
sudo apt-get install libcap2-bin 
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
```

In order to autostart the app, use crontab to auto-start node ([found here](https://stackoverflow.com/questions/21542304/how-to-start-a-node-js-app-on-system-boot)):

  ```shell
  sudo crontab -e
  ```

Then add to crontab:

  ```shell
  # Start node on (re)boot
  @reboot sudo /usr/bin/node /home/pi/www/index.js &
  ```
