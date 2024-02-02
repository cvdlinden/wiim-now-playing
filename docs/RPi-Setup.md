# Setting up a Raspberry Pi in kiosk mode on a touchscreen

> **Warning**: [Goose chasing](https://www.urbandictionary.com/define.php?term=goose%20chase) ahead!!!

**Goal**: Start a Raspberry Pi with Chromium in kiosk mode on the local (DSI) display to show the wiim-now-playing app.

The 'works-on-my-machine' short-hand guide:

- Prepare a Raspberry Pi with an attached touchscreen.  
  Make sure you know how to activate the screen before anything else.  
  Test with a regular RPi OS to see if the screen works (both video and touch).
- Prepare a Raspberry Pi OS Bullseye (legacy) sd-card without a desktop.  
  Make sure you can see a command prompt on the touchscreen.
- The 'Lite' version with LXDE (see blockdev.io link) is advised.  
  Note: LightDM apparently does not like autologin and the Fat version is overkill.
- Add the chromium-browser with minimal desktop dependencies (LXDE).
- Whole lot of Googling to fix 'this-and-that'.  
  See Additional info below.

## Raspberry Pi OS Bullseye (legacy)

The latest version of RPi OS, Bookworm, doesn't play very nice with some touchscreens. Read the screens manufacturers documentation to see if it can be enabled on the latest OS version.

Reverting to Bullseye seems a safe option if you run into trouble.

## Chromium-browser in Kiosk mode

Useful links to get kiosk mode working:

- Fat, Lite and Super Lite versions: <https://blockdev.io/raspberry-pi-2-and-3-chromium-in-kiosk-mode/>
- <https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/>
- <https://reelyactive.github.io/diy/pi-kiosk/>
- <https://github.com/guysoft/FullPageOS>

**Note**: Your mileage may vary.

## Node.js on Raspberry Pi OS (Bullseye)

Links to get Node.js working on the RPi:

- <https://deb.nodesource.com/>
- <https://pimylifeup.com/raspberry-pi-nodejs/>

## Additional info

### Node.js version

Raspberry Pi OS installs an old version of NodeJS, without NPM. Check the above links for an updated version. At this time the LTS version is 20! With which this app was made.

In case signing does not work, make sure the keyrings folder is present:  
  ``sudo mkdir /etc/apt/keyrings | sudo chmod 755 /etc/apt/keyrings``

By default Debian does not like claiming port 80 as a non-root user.  
In order to claim port 80 (default www) as a non-root/sudo user, use ([found here](https://stackoverflow.com/questions/60372618/nodejs-listen-eacces-permission-denied-0-0-0-080)):

```shell
sudo apt-get install libcap2-bin 
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
```

Otherwise, change the port variable in ./server/index.js.

### Autostart chromium-browser

In order to autostart the app, use crontab to auto-start node ([found here](https://stackoverflow.com/questions/21542304/how-to-start-a-node-js-app-on-system-boot)):

  ```shell
  sudo crontab -e
  ```

Then add to crontab:

  ```shell
  # Start node on (re)boot
  @reboot su pi /usr/bin/node /home/pi/www/index.js &
  ```

Where 'pi' is the name of the user account.

### Screensaver and lock screen

You can set the RPi to never fall asleep. If you so require, do so.

But if you just want to let the screen go dark and wake up on touch...  
Tell it to ignore the screensaver or use ``sudo apt remove xscreensaver``.
This does not get rid of the lock screen after the screensaver. On how to do that, use your friend Google, and prepare for a long night.
