# The 'works-on-my-machine' short-hand guide {#short-hand}

If you are proficient with Raspberry Pi's and already know your way around them blindly, then here's the gist.

If you are not proficient with deploying apps to a Raspberry Pi, or need more specific guidance, please read the next chapter(s).

## **With a touchscreen:**

1. [Prepare a Raspberry Pi, with an attached touchscreen](setup-touchscreen.md).  
   Make sure you know how to activate the screen before anything else.  
   Test with a regular RPi OS to see if the screen works (both video and touch).
2. [Prepare a Raspberry Pi OS sd-card](prepare-sd-card.md) without a desktop i.e. the Lite version.  
   Make sure you can see a command prompt on the touchscreen.
3. Add the wiim-now-playing app over SSH.
4. Install the 'Lite' version of LXDE.  
   Note: LightDM apparently does not like autologin and the Fat version is overkill.
5. Add the chromium browser with minimal desktop dependencies (LXDE).
   And set the chromium browser as the kiosk default.
6. Whole lot of Googling to fix 'this-and-that'.  

Now see: [Setting up a RPi with a touchscreen](setup-touchscreen.md)

## **Without a screen/headless:**

1. [Prepare a Raspberry Pi, with or without any display attached](setup-headless.md).  
   A display is not required for setup!  
2. [Prepare a Raspberry Pi OS sd-card](prepare-sd-card.md) without a desktop i.e. the Lite version.  
   Make sure you can connect over the network, i.e. setup the Wifi during sd card initialisation.
3. Add the wiim-now-playing app over SSH.
4. Some Googling to fix 'this-and-that'.

Now see: [Setting up a RPi in headless mode](setup-headless.md)
