# Setting up a Raspberry Pi in kiosk mode on a touchscreen

> **Warning**: [Goose chasing](https://www.urbandictionary.com/define.php?term=goose%20chase) ahead!!!

**Goal**: Start a Raspberry Pi with Chromium in kiosk mode on the local (DSI) display to show the wiim-now-playing app.

**The 'works-on-my-machine' short-hand guide:**

1. Prepare a Raspberry Pi with an attached touchscreen.  
   Make sure you know how to activate the screen before anything else.  
   Test with a regular RPi OS to see if the screen works (both video and touch).
2. Prepare a Raspberry Pi OS Bullseye (legacy) sd-card without a desktop.  
   Make sure you can see a command prompt on the touchscreen.
3. The 'Lite' version with LXDE (see blockdev.io link) is advised.  
   Note: LightDM apparently does not like autologin and the Fat version is overkill.
4. Add the chromium-browser with minimal desktop dependencies (LXDE).
5. Whole lot of Googling to fix 'this-and-that'.  

For a more step-by-step process read below.

## 1. Prepare a Raspberry Pi with a touchscreen

First, make sure that your touchscreen works properly i.e. you have an image output and the touch input works.

1. Connect you Raspberry Pi to the touchscreen by following the instructions of the manufacturer.
2. Grab a copy of [Raspberry Pi OS](https://www.raspberrypi.com/software/), with the desktop, to check whether your RPi works with the screen attached. Use the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) to download and write the OS to an SD card and insert the card into you RPi.
3. If the screen displays the Raspberry Pi OS Desktop, you are good to go.  
   If it doesn't display a desktop, please follow the manufacturers manual in order to activate the screen. You may need additional drivers for screen output.  
   Please take note of the instructions to enable the display as you will need them again later.

## 2. Prepare an SD card with Raspberry Pi OS Lite

Depending on the previous results you could use the latest version of RPi OS, Bookworm (February 2024). However it may not play very nice with some touchscreens. Read the screen manufacturers documentation to see if it can be enabled on the latest OS version.

Otherwise try the legacy version (Bullseye) or older. Reverting to Bullseye seems a safe option if you run into trouble.

1. Use the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) to download a version of Raspberry Pi OS **Lite**. As we won't be needing a full desktop environment.
2. Choose your SD card, the one you've previously used to test the functionality. After selecting the SD card to use, it will ask you whether you would like to apply customisations. Choose Edit Settings:  
   ![Settings](../assets/Screenshot%202024-02-13%20234421.png)
3. In the General tab set the hostname of your RPi. Keep it short, simple and unique, you'll thank yourself later. In the example below I've used _wnp.local_.  
   Please also set a username and password as you will need those to connect to and setup later.  
   ![Settings](../assets/Screenshot%202024-02-13%20235651.png)  
   Also, if you are going to use WiFi, this is the moment to tell the RPi those details.
4. In the Services tab select Enable SSH and use the default 'use password authentication'. Please remember the username and password you've set in the General tab!  
   ![Settings](../assets/Screenshot%202024-02-14%20000706.png)  
5. Now press Save and Click Yes to apply the customisations. Now create the SD card and wait for it to finish.
6. After finishing put the SD card in your RPi.

## 3. Configure your Raspberry Pi OS through SSH

After powering up the RPi with Raspberry Pi OS Lite you'll find yourself at a command prompt or a blank screen. Just let it settle a bit as during the first startup, after you've created the new SD card, the OS will prepare itself.

1. Start a command prompt. In these examples I am using PowerShell 7 on Windows 11. On a Mac you can use the Terminal.
2. At the command prompt type ``ssh {username}@{servername}.local``. Where ``{}`` is your username you defined at the previous steps. And ``{servername}`` is the name as your hostname. In the example below I've used _caspar@wnp.local_.
   ![Settings](../assets/Screenshot%202024-02-14%20002224.png)  
3. At the first time connecting it will ask if you want to continue. Type ``yes`` and press Enter.
4. Every time we will connect to the RPi this question will no longer be asked. You can then use your password to connect:  
   ![Settings](../assets/Screenshot%202024-02-14%20002718.png)  
5. After connecting to your RPi over SSH you'll be greeted with a command prompt from the RPi server.  

   ```bash
   username@server:~ $
   ```

   Again, the username and servername are the ones you've defined earlier.  
   Congrats! It is working.

### sudo raspi-config

First we will configure the Raspberry Pi itself.

1. At the command prompt type:

   ```bash
   sudo raspi-config
   ```

2. You'll be greeted by the Configuration Tool menu:  
   ![Settings](../assets/2024-02-14.png)  
   _Use the arrow keys on your keyboard to navigate this menu_
3. From the menu select **1 System Options** > **S5 Boot / Auto Login**.  
   Select **B2 Console Autologin** to automatically login at the command prompt on startup.
4. Whether you need to set anything from **2 Display Options** or **3 Interface Options** is up to your specific hardware. Normally you would not need to set anything here. The same goes for options 4 and 5.  
   _However I've had one instance that I needed to set the 'WLAN Country' (under the Localisation Options) 2 times before it remembered it correctly and accepted the WiFi connection._
5. Under **6 Advanced Options** you may want to use **A1 Expand Filesystem**, in order for the entire capacity of the SD card to be recognised after reboot.
6. Choose **8 Update** to get all of the latest updates to the system, while you're at it.
7. Finally select Finish (arrow right key) and press Enter.

Maybe now is a good time to do a reboot of the RPi. Type at the command prompt:

```bash
sudo reboot
```

And wait for the Raspberry Pi to return to the command prompt, before you reconnect over ssh, with.

```powershell
ssh username@server.local
```

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
