# Auto-starting the wiim-now-playing app on boot

Whenever the RPi reboots, i.e. due to the intentional or unintentional loss of power, we would like to start the server/app automatically at startup. There are several methods for this to happen. Here's my version.

1. Make an SSH connection to the RPi.
2. We will use crontab to make the app start at every reboot. Use:  

   ```shell
   sudo crontab -e
   ```

   *If this is the first time it will ask which editor to use. My preference is the default, nano.*

3. In the crontab text file add the following lines at the end:  

   ```shell
   # Start node on (re)boot
   @reboot su username -c "/usr/bin/node /home/username/wiim-now-playing/server/index.js" &
   ```

   > [!NOTE]
   > Replace the 'username' with **your** username! Right after su **and** in /home/username/...  
   > *If you've placed the wiim-now-playing app in a different folder then ammend the last part to reflect the correct folder!*  
   > *Also note that the & at the end of the line is required!*

4. Use CTRL+X -> Y to confirm -> Enter to confirm the filename.  
   The change will now be implemented.

5. You can check the changes by doing another ```sudo crontab -e```. You can see your edits at the end of the text.  
   Exit out of Nano like the first time.

To make sure WiiM Now Playing starts up, do a reboot (``sudo reboot``), wait for the RPi to come back up completely, open up a browser and point it to the RPi (i.e. ``servername.local``). It should now show you the wiim-now-playing app after each reboot.

If not, then redo the ``sudo crontab -e`` command to check if the rule you've set is correct.

> [!NOTE]
> If the app looks garbled in the browser, please refresh your browser window i.e. clear your cache. If the issues persist, be patient and wait for things to settle. And/or try a power cycle of the Raspberry Pi by unplugging the powercord of the RPi completely, wait a while and then plug it back in.

If you went down the headless route, then you are done!

> [!TIP]
> In the RPi commandline you can use ``top`` or ``htop`` to see if there is a node process running. It should be on *top* of the list.

If you want to display the WiiM Now Playing app directly on a touchscreen or attached computerscreen, proceed with [Enable kiosk mode](setup-kiosk.md).
