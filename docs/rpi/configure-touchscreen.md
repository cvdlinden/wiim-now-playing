# Configuring the touchscreen

> [!NOTE]
> Skip this step if you are doing a headless installation!  
> Go directly to: [Add WNP to the Raspberry Pi](add-wnp-to-rpi.md)

At this step you still may not have an image on your touchscreen display. Please have a look at the manufacturers documentation in order to enable the display through the command prompt. You may need to configure some drivers of config files.

In my example I'm using a Raspberry Pi 4 with the official Raspberry Pi touchscreen. And if you're familiar with those, the screen output is upside-down by default. So let's rectify that. For this we refer to [Changing the screen orientation](https://www.raspberrypi.com/documentation/accessories/display.html#changing-the-screen-orientation) documentation by Raspberry Pi.

1. Connect to the Raspberry Pi over SSH: ``ssh username@servername.local``
2. Start editing the cmdline.txt file by typing at the command prompt:  

   ```bash
   sudo nano /boot/firmware/cmdline.txt
   ```

3. At the end of the line add:

   ```bash
    video=DSI-1:800x480@60,rotate=180
   ```

   **NOTE: there is a space before video= and after anything that is already on that line!**  
   _We will use rotate=180 to put the display the right way up._

4. Use CTRL+X -> Y to confirm -> Enter to confirm the filename.  
   The display rotation change should now have been set.
5. However the touch input should also be rotated. Type the following to edit the config.txt file:

   ```bash
   sudo nano /boot/firmware/config.txt
   ```

6. Find the line that says ``display_auto_detect=1``. Add a # in front to comment out that line.  
   Then add a line that says ``dtoverlay=vc4-kms-dsi-7inch,invx,invy``. So that it looks like this:  

   ```shell
   # Automatically load overlays for detected DSI displays
   #display_auto_detect=1

   # Rotate the touch input
   dtoverlay=vc4-kms-dsi-7inch,invx,invy
   ```

7. Then use CTRL+X -> Y to confirm -> Enter to confirm the filename.
8. In order for these changes to take effect we need to do a reboot:

   ```bash
   sudo reboot
   ```

Wait for the RPi to reboot. It may start upside-down first, but it will right itself eventually...

![Touchscreen rotated](../assets/rpi-console-start.jpg)

**Success!**
