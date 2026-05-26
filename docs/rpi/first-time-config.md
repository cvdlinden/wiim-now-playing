# First time configuration of your Raspberry Pi OS through SSH

If you haven't done so already, you can add the SD card to your Raspberry Pi and power it up for the first time.

**After powering up the RPi with Raspberry Pi OS Lite you will need to wait for it to initialise.**

Just let it settle a bit as during the first startup, after you've created the new SD card, the OS will need to prepare itself which will take some time.

> [!NOTE]
> You can also connect a keyboard/mouse/screen to the Raspbery Pi in order to conduct the next steps. But, presuming you already have a computer on which you've prepared the SD card, might as well use that to connect over SSH.

## Check the connection to the Raspberry Pi

1. Open up a fresh command prompt/bash shell on your system.  

   > [!NOTE]
   > In these examples I am using PowerShell 7 on Windows 11. On a Mac you can use the Terminal.

2. You can make sure that the Raspberry Pi is up and running by using ```ping servername.local```, where servername is the name that you gave your Pi while preparing the SD card.

   ```console
   > ping -4 wnp.local

   Pinging wnp.local [192.168.1.100] with 32 bytes of data:
   Reply from 192.168.1.100: bytes=32 time=8ms TTL=64
   Reply from 192.168.1.100: bytes=32 time=10ms TTL=64
   Reply from 192.168.1.100: bytes=32 time=7ms TTL=64
   Reply from 192.168.1.100: bytes=32 time=7ms TTL=64

   Ping statistics for 192.168.1.100:
      Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
   Approximate round trip times in milli-seconds:
      Minimum = 7ms, Maximum = 10ms, Average = 8ms
   ```

   If you are getting timeouts, the RPi is probably still working on starting up. Just try again in a minute or so.  

   Or if you did not insert the correct Wifi name or password the RPi can't connect. In this  case you can remake the SD card with the Imager tool and provide the WiFi settings again.

   > [!TIP]
   > If you are able connect the Pi with a network cable, this may fix the connection issue.  
   > Later on you can fix the WiFi, using raspi-config, see further down below.

## Connecting to your Raspberry Pi over SSH

1. Open up a fresh command prompt/bash shell on your system.  

   > [!NOTE]
   > In these examples I am using PowerShell 7 on Windows 11. On a Mac you can use the Terminal.

2. At the command prompt type ``ssh username@servername.local``.

   Where ``username`` is **your username** that you've defined in the previous steps. And ``servername`` is the name you've set as your **hostname**. 

   The first time connecting to the RPi, it will ask if you want to continue. Type ``yes`` and press Enter.

   ```console
   > ssh user@wnp.local
   The authenticity of host 'wnp.local (...)' cant' be established.
   ED25519 key fingerprint is SHA256:...
   This key is not known by any other names
   Are you sure you want to continue connecting (yes/no/[fingerprint]?) |
   ```

   > [!NOTE]
   > If your computer complains about non matching key fingerprints?  
   > You may want to remove the cached previous entries from your local hosts file.  
   > Please look up on how to do this on your specific OS!  
   > On Windows the hosts file can be found at ```C:\Users\Username\.ssh\known_hosts```  
   > Open ```known_hosts``` with notepad and delete the entries regarding this Raspberry Pi.

3. Every time we will connect to the RPi this question will no longer be asked.  
   You can then use your password directly to connect:  

   ```console
   > ssh user@wnp.local
   user@wnp.local's password:
   ```

4. After connecting to your RPi over SSH you'll be greeted with a command prompt from the RPi server, like:  

   ```console
   user@wnp:~ $ |
   ```

   Again, the username and servername are the ones you've defined earlier.

   Congrats, it is working!

## Configure the RPi with sudo raspi-config

As with any new install, first we will configure and update the Raspberry Pi itself.

::: tabs

=== Current version (Trixie)

1. At the command prompt type:

   ```shell
   sudo raspi-config
   ```

   *The sudo command may require that you enter your password.*

2. You'll be greeted by the Software Configuration Tool menu:  

   ![Settings](../assets/raspi-config.png)  
   *Use the arrow keys on your keyboard to navigate this menu*

3. Depending on your situation or requirements you may want to enable or disable options in raspi-config. Feel free to explore all of the settings offered in the Software Configuration Tool.  

   The following are some settings you most likely **do want to set**.

   Enter **1 System Options**.  

   If you need to edit your WiFi settings, choose **S1 Wireless LAN**. But most likely you are already set, so you probably don't need to.

   Enter **S5 Boot**.
   Select **B1 Console Text Console**. We don't have a GUI, yet, so no point of selecting the Desktop GUI option.

   Enter **1 System Options**, again.  
   Enter **S6 Auto Login**.  
   Answer **&lt;Yes&gt;** to the question whether you would like to login automatically.

   *You may want to explore other options in **1 System Options**, but this is it for WNP.*

4. It isn't necessary to change anything under **2 Display Options**, unless required for your specific situation.  
   > [!NOTE]
   >If your are going for the touchscreen route, the display will be enabled in the following steps. Not under this menu item.

5. Under **3 Interface Options** you can enable/disable certain interfaces of your Raspberry Pi. But since we already enabled SSH, otherwise you wouldn't be in this menu, we probably don't need to set anything else here.

6. Under **4 Performance Options** you may want to have a look at the **P3 Fan** settings, if your Raspberry Pi is equiped with one i.e. a Raspberry Pi 5 and up.

7. Under **5 Localisation Options** one can alter the locale, if you didn't set the proper one already during the SD card preparation.  

   > [!NOTE]
   > If your WiFi connection behaves erratically, check the **L4 WLAN Country** setting and set it to your country accordingly!

8. Under **6 Advanced Options**, select **A1 Expand Filesystem**.

   By default the Imager only writes the image of the OS you've selected during the SD card preparation. Leaving most of the SD card space, depending on the capacity, empty and unused. This option will resize the OS partition and claim the rest of the SD card for use. You do need to activate this!

   ```console
   Root partition has been resized.
   The filesystem will be enlarged upon the next reboot
   ```

   The rest of the advanced options may or may not be required. If unsure, just stick to the defaults!

9. Under **8 Update** you can update the Software Configuration Tool. It is wise to choose this option. Although you've installed a new SD card, new versions/updates/fixes may still be available.

10. Now is the time to choose **&lt;Finish&gt;**. The Software Configuration Tool will close.

=== Legacy version (Bookworm/Bullseye)

1. At the command prompt type:

   ```bash
   sudo raspi-config
   ```

2. You'll be greeted by the Software Configuration Tool menu:  
   ![Settings](../assets/raspi-config.png)  
   *Use the arrow keys on your keyboard to navigate this menu*

3. From the menu select **1 System Options** > **S5 Boot / Auto Login**.  
   Select **B2 Console Autologin** to automatically login at the command prompt on startup.

4. Whether you need to set anything from **2 Display Options** or **3 Interface Options** is up to your specific hardware. Normally you would not need to set anything here. The same goes for options 4 and 5.  
   *However I've had one instance that I needed to set the 'WLAN Country' (under the Localisation Options) 2 times before it remembered it correctly and accepted the WiFi connection.*

5. Under **6 Advanced Options** you may want to use **A1 Expand Filesystem**, in order for the entire capacity of the SD card to be recognised after reboot.

6. Choose **8 Update** to get all of the latest updates to the system, while you're at it.

7. Finally select Finish (arrow right key) and press Enter.

:::

Do a reboot of the RPi to finalise the configuration. Type at the command prompt:

```shell
sudo reboot
```

Then wait for the Raspberry Pi to boot up again, you can use the ```ping``` command to test whether the RPi is back up, before you reconnect over ssh with.

```shell
ssh user@wnp.local
```
