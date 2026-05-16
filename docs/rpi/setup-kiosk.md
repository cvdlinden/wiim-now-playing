# Enable Kiosk mode on a Raspberry Pi

Now that you've configured the RPi and the wiim-now-playing app (server part) to run every time the RPi (re)boots, we would like to show the client on the (touch)screen as well.

## Configuring Kiosk mode

For this we need to get the chromium-browser to also start automatically in kiosk mode and point to the wiim-now-playing app.

> Note: The ```chromium-browser``` package may have been moved to the ```chromium``` package.  
  If the ```chromium-browser``` package cannot be found, use the ```chromium``` package.

1. Make an SSH connection to the RPi.
2. Install the chromium-browser and some basic desktop functionality (LXDE) by using the following commands to install the required applications:

   ```bash
   sudo apt install chromium-browser
   sudo apt install unclutter
   sudo apt install lxde
   ```

   _Note: This will take a while! If your SSH connection is broken off, please wait a while before reconnecting. Just let it do its thing._  
   _Note: If the RPi stays unresponsive for a long time it may take a power off from the RPi to return to normal operation._

3. Once you can reconnect, then change the startup behaviour by opening ```sudo raspi-config```.
4. From the menu select **1 System Options** > **S5 Boot / Auto Login**.  
   Select **B2 Desktop Autologin** to automatically start the Desktop GUI.  
   Finish and reboot.
5. You will now be greeted by a desktop environment on the RPi display instead of a command prompt.

   ![LXDE Desktop](../assets/IMG_3692.jpg)

6. Reconnect to the RPi through SSH and use the following command to edit the LXDE autostart file:

   ```bash
   sudo nano .config/lxsession/LXDE/autostart
   ```

7. Edit the autostart file by commenting out all of the lines already present.  
   Add a line at the end like ``@/home/username/autostart.sh``.  
   Replace username with **your** username!

   ```bash
   #@lxpanel --profile LXDE
   #@pcmanfm --desktop --profile LXDE
   #@xscreensaver -no-splash

   @/home/username/autostart.sh
   ```

8. Then use CTRL+X -> Y to confirm -> Enter to confirm the filename.
9. Next we will create and edit the autostart.sh file. Use:

   ```bash
   nano autostart.sh
   ```

   _Note that sudo is not required!_

10. Add the following lines to the autostart.sh file:  

    ```bash
    #!/bin/bash

    # Start chromium-browser in Kiosk mode
    sed -i 's/"exited_cleanly": false/"exited_cleanly": true/' ~/.config/chromium/Default/Preferences
    chromium-browser --app=http://localhost --kiosk --noerrdialogs --incognito --hide-scrollbars --no-first-run

    exit 0
    ```

11. Then use CTRL+X -> Y to confirm -> Enter to confirm the filename.
12. Before we do a reboot we need to make autostart.sh executable, use:

    ```bash
    chmod +x autostart.sh
    ```

13. Now do a reboot (``sudo reboot``) of the RPi.
14. Wait for the RPi to reboot. This may take a while...  

    ![Chrome Kiosk](../assets/IMG_3693.jpg)

Troubleshooting:

- If the screen looks garbled/unstyled, wait a little while for it to settle.  
  Or try a power cycle by unplugging the RPi completely, wait and then plug it in again.
- It may also help to have the RPi connected through an Ethernet cable.  
  WiFi initalisation is much slower than an ethernet connection.
- If the network is slow to initialise you can add a wait state to the autostart script through ``nano autostart.sh``:

  ```bash
  #!/bin/bash

  # Wait for LAN to be enabled
  while [ $(/usr/sbin/ifconfig | grep -cs 'broadcast') -lt 1 ]; do sleep 2; done
  echo "WNP: hostname $(hostname -I)"
  echo "WNP: broadcast $(/usr/sbin/ifconfig | grep -cs 'broadcast')"

  # Start chromium-browser in Kiosk mode
  sed -i 's/"exited_cleanly": false/"exited_cleanly": true/' ~/.config/chromium/Default/Preferences
  chromium-browser --app=http://localhost --kiosk --noerrdialogs --incognito --hide-scrollbars --no-first-run

  exit 0
  ```

- Try and add a ``sleep`` in front of the chromium browser line, like ``sleep 5 && chromium-browser ...``.  
  This will delay the start of the browser in order to let the OS settle first.

### Screensaver

Unfortunately the OS still has a screensaver/-blanking enabled. After a while your screen will go blank. If you always want to have the screen turned on, add the following lines at the beginning of the autostart.sh file:

```bash
#!/bin/bash

# Screen always on
xset s off
xset -dpms
xset s noblank

...{the rest}
```

Now, if like me, you do want to have the screen only turned on for a limited amount of time and not light up the room 24/7, here are some alternative steps:

1. Connect to the RPi through SSH.
2. Edit the autostart file:

   ```bash
   nano autostart.sh
   ```

3. Add the following lines to the autostart file, just below the ``#!/bin/bash`` line:

   ```bash
   # Set screen blanking
   xset -dpms
   xset s blank
   xset s 900 900
   ```

   - _The '-dpms' disables the Display Power Management, effectively stopping modern power management from interrupting._  
   - _The 'blank' statement makes sure that signals are cut from the display. And the backlight is being turned off.  
   However, some screens do not like being cut off and show a 'not connected' message/colorspectrum. Which defeats the purpose of the screen blanking. For those cases use the 'noblank' option instead._
   - _The 900 stands for 900 seconds i.e. 15 minutes. Feel free to change to any timespan you'd like._

### Screen(saver) locking

One unfortunate behaviour of letting your display fall asleep is that when you do wake it up, by touching the screen, it will prompt you for your password. This is good basic security behaviour for any desktop, but not for a kiosk mode application. Not in the least because you won't have a keyboard attached.

In order to stop the screen locking in an LXDE environment do the following:

1. Connect to your RPi through SSH.
2. From the command line create a new local autostart folder in .config:

   ```bash
   mkdir -p ~/.config/autostart
   ```

3. Copy the light-locker configuration file to the new autostart folder in your home/.config folder.

   ```bash
   cp /etc/xdg/autostart/light-locker.desktop ~/.config/autostart
   ```

4. Now edit this file with:

   ```bash
   sudo nano .config/autostart/light-locker.desktop
   ```

5. Scroll down to the end of the text. There you will find a line, similar to:

   ```bash
   NotShowIn=GNOME;Unity;
   ```

   Add ``LXDE;`` to the end like so:

   ```bash
   NotShowIn=GNOME;Unity;LXDE;
   ```

6. Use CTRL+X -> Y to confirm -> Enter to confirm the filename.
7. Do a ``sudo reboot`` to let the changes take effect.  
   Wait for the display to fall asleep and tap the screen. You will no longer get a login screen.

### Blank screen background color

Some installations will show a grayish screen when you let the it fall asleep, using 'noblank'. If you encounter such a situation, instead of just a black/blank screen. Add the following to the end of your autostart.sh script (``nano autostart.sh``). Add it just before the ``exit 0`` line.

```bash
# Set default background to default black
sleep 3 & xsetroot -display :0 -def
```

### Get rid of the mouse cursor

When you tap your screen you will notice a mouse cursor showing. I haven't yet found a method to get rid of that entirely. It is especially annoying when you've turned you Raspberry Pi touchscreen the right way up, since the mouse cursor shows up inversely where you tap your screen.

## Additional info

Useful links to get kiosk mode working:

- Fat, Lite and Super Lite versions: <https://blockdev.io/raspberry-pi-2-and-3-chromium-in-kiosk-mode/>
- <https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/>
- <https://reelyactive.github.io/diy/pi-kiosk/>
- <https://github.com/guysoft/FullPageOS>

**Note**: Your mileage may vary.
