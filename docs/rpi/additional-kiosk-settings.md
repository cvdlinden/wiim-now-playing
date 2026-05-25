# Additional Kiosk mode configuration

Now that you have a [working Kiosk mode for the WiiM Now Playing app](setup-kiosk.md), there might be still some issues or things you may want to tweak.

The following subjects are optional.

## Network issues, after startup

The OS and the chromium browser may have started up already before the network has been initialised. I.e. the screen lights up, but you can't reach it over the network and/or the WNP app isn't responsive.

It may help to connect the RPi directly through an Ethernet cable. WiFi is much slower to initialise than an ethernet connection. If it works fine with a cable and not over WiFi? Or just want to make sure the WiFi has started before anything else. Add the following.

If the network is slow to initialise you can add a wait state to the autostart script through ``nano autostart.sh``:

```bash
#!/bin/bash

# Wait for LAN to be enabled
while [ $(/usr/sbin/ifconfig | grep -cs 'broadcast') -lt 1 ]; do sleep 2; done
echo "WNP: hostname $(hostname -I)"
echo "WNP: broadcast $(/usr/sbin/ifconfig | grep -cs 'broadcast')"

# {the rest of your autostart.sh}

exit 0
```

This will make sure that the startup procedure waits for WiFi, before starting the chromium browser.

> A ```sudo reboot``` is required for the setting to take effect.

## Disable the Screensaver

By default the OS still has a screensaver/-blanking enabled. After a while your screen will go blank. If you always want to have the screen turned on, add the following lines at the beginning of the autostart.sh file:

1. Connect to the RPi through SSH.
2. Edit the autostart file:

   ```shell
   nano autostart.sh
   ```

3. Add the following lines to the autostart file, just below the ``#!/bin/bash`` line:

   ```bash
   #!/bin/bash

   # Screen always on
   echo "WNP: Setting xset..."
   xset s off
   xset -dpms
   xset s noblank

   ...{the rest}
   ```

> A ```sudo reboot``` is required for the setting to take effect.

## Configure the Screensaver

Now, if like me, you do not want to have the screen light up the room 24/7. But only turned on for a limited amount of time. Here are some alternative steps to configure the screensaver settings:

1. Connect to the RPi through SSH.
2. Edit the autostart file:

   ```shell
   nano autostart.sh
   ```

3. Add the following lines to the autostart file, just below the ``#!/bin/bash`` line:

   ```bash
   #!/bin/bash

   # Set screen blanking
   echo "WNP: Setting xset..."
   xset -dpms
   xset s blank
   xset s 900 900

   ...{the rest}
   ```

   * The '-dpms' disables the Display Power Management, effectively stopping modern power management from interrupting.
   * The 'blank' statement makes sure that signals are cut from the display. And the backlight is being turned off.

     > [!NOTE]
     > However, some screens do not like being cut off and show a 'not connected' message/colorspectrum. Which defeats the purpose of the screen blanking. For those cases use the 'noblank' option instead.

   * The 900 stands for '900 seconds' i.e. (900/60=) 15 minutes.  
     Feel free to change to any timespan you like and feels optimal to you.

> A ```sudo reboot``` is required for the setting to take effect.

## Blank screen background color

Some installations will show a grayish screen when you let the it fall asleep, using 'noblank'. If you encounter such a situation, instead of just a black/blank screen. Add the following to the end of your autostart.sh script (``nano autostart.sh``). Add it just before the ``exit 0`` line.

```bash
# Set default background to default black
sleep 3 & xsetroot -display :0 -def
```

> A ```sudo reboot``` is required for the setting to take effect.

## Get rid of the mouse cursor

When you tap your screen you will notice a mouse cursor showing. I haven't yet found a method to get rid of that entirely. It is especially annoying when you've turned you Raspberry Pi touchscreen the right way up, since the mouse cursor shows up inversely where you tap your screen.

You can try adding the following line in your ```autostart.sh```

```bash
# Hide the mouse cursor on the touchscreen
unclutter -idle 0 &
```

> A ```sudo reboot``` is required for the setting to take effect.

## Debug logging

If things behave erratically, but you can connect over SSH. Here are some pointers to see what is going on behind the scenes.

```shell
cat .xsession-errors
```

Take a look if there are any errors or messages that may help.

```shell
cat .cache/lxsession/LXDE/run.log
```

Here you'll find the complete start up log of LXDE. Including the ```echo "WNP: ..."``` messages you've put in ```autostart.sh```.

## Additional info

Useful links to get kiosk mode working:

* Fat, Lite and Super Lite versions: <https://blockdev.io/raspberry-pi-2-and-3-chromium-in-kiosk-mode/>
* <https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/>
* <https://reelyactive.github.io/diy/pi-kiosk/>
* <https://github.com/guysoft/FullPageOS>

**Note**: Your mileage may vary.
