# Deploying WiiM Now Playing on a Raspberry Pi

> [!CAUTION]
> Be prepared for [Goose chasing](https://www.urbandictionary.com/define.php?term=goose%20chase) ahead!!!  

The following 'manual' is by no means fool-proof as there are wildly different versions of Raspberry Pi devices and OS'es abound. Take this more as a 'guide into the wilderness' then a step-by-step instruction manual. If you're lost, track back and ask around. But if you succeed, then you are the cool-one-on-the-block and can show off to your friends!

## Quick start

For those inclined to read the minimal instruction, read the [short-hand](#short-hand), then:

* [Setting up a RPi with a touchscreen](setup-touchscreen.md)
* [Setting up a RPi in headless mode](setup-headless.md)

## Hardware

This project was originally meant to be run on a Raspberry Pi with a touchscreen.

But for some reason many wanted to run it on a TV (not literally). Some are running it, as a Docker image, somewhere on old hardware (old business Dells, NAS?). Or just in the background on their daily PC.

Then there is a plethora of 'RPi-clone' Single Board Computers (SBC). I have no idea, I have not tested those. Feel free to be the first!

Whatever hardware you have. If you have a WiiM device you are using to listen to music. And you have some (leftover) hardware that is able run Node.js, has 1GB or more of memory in total, 8GB of storage and a local network connection? Then I don't see no reason for not running WiiM Now Playing.

Lower specs than that may still work, but you'll be running into limits sooner than you would like.

Please have a look at the [Hardware requirements](requirements.md) for a Raspberry Pi setup.

## Raspberry Pi OS

The Operating System on a Raspberry Pi comes in different flavors. Wherever applicable, and known, this manual will show the differences between 'Trixie', 'Bookworm' and/or 'Bullseye' variants.

## The 'works-on-my-machine' short-hand guide {#short-hand}

### **With a touchscreen:**

1. Prepare a Raspberry Pi, with an attached touchscreen.  
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

### **Without a screen/headless:**

1. Prepare a Raspberry Pi, with or without any display attached.  
   A display is not required for setup!  
2. [Prepare a Raspberry Pi OS sd-card](prepare-sd-card.md) without a desktop i.e. the Lite version.  
   Make sure you can connect over the network, i.e. setup the Wifi during sd card initialisation.
3. Add the wiim-now-playing app over SSH.
4. Some Googling to fix 'this-and-that'.

Now see: [Setting up a RPi in headless mode](setup-headless.md)
