# First time configuration of your Raspberry Pi OS through SSH

After powering up the RPi with Raspberry Pi OS Lite you'll need to wait for it to initialise. Just let it settle a bit as during the first startup, after you've created the new SD card, the OS will need to prepare itself which will take some time.

Note: you can also connect a keyboard/mouse/computerscreen to the Raspbery Pi in order to conduct the next steps. But, presuming you already have a computer on which you've prepared the SD card, might as well use that to connect over SSH.

1. Start a command prompt. In these examples I am using PowerShell 7 on Windows 11. On a Mac you can use the Terminal.

2. You can make sure that the Raspberry Pi is up and running by using ```ping servername.local```, where servername is the name that you gave your Pi while preparing the SD card.

   If you get timeouts, it is either still working on starting up or you did not insert the correct Wifi name or password.

   In the latter case you can remake the SD card with the Imager tool.

   If you are able connect the Pi with a network cable, this may fix the connection issue. Later on you can fix the WiFi, using raspi-config.

3. At the command prompt type ``ssh username@servername.local``.

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
   > You may want to remove the cached entries from your local hosts file.  
   > Please look up on how to do this on your specific OS!  
   > On Windows the hosts file can be found at ```C:\Users\Username\.ssh\known_hosts```

4. Every time we will connect to the RPi this question will no longer be asked.  
   You can then use your password directly to connect:  

   ```console
   > ssh user@wnp.local
   user@wnp.local's password:
   ```

5. After connecting to your RPi over SSH you'll be greeted with a command prompt from the RPi server, like:  

   ```console
   user@wnp.local:~ $ |
   ```

   Again, the username and servername are the ones you've defined earlier.

   Congrats, it is working!

## Configure the RPi with sudo raspi-config

As with any new install, first we will configure and update the Raspberry Pi itself.

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

Maybe now is a good time to do a reboot of the RPi. Type at the command prompt:

```bash
sudo reboot
```

And wait for the Raspberry Pi to return to the command prompt, before you reconnect over ssh with.

```shell
ssh user@wnp.local
```
