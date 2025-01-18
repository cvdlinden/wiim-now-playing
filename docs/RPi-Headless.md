# Setting up a Raspberry Pi in headless mode

> **Warning**: [Goose chasing](https://www.urbandictionary.com/define.php?term=goose%20chase) ahead!!!  
The below 'manual' is by no means fool-proof as there are wildly different versions of RPi devices and OS'es abound.

**Goal**: Get the wiim-now-playing app running on a somewhat recent Raspberry Pi device, without direct display output i.e. 'headless'. The Pi can then be put away out of sight. The output will be shown by external devices through means of a browser (on a mobile phone, tablet, TV, other computer, another Raspberry Pi, ...).

Which type of Raspberry Pi should I use? [See the Raspberry Pi requirements.](RPi-Requirements.md)

> For setting up a Raspberry Device with a touchscreen see: [Setting up a Raspberry Pi in kiosk mode on a touchscreen](RPi-Setup.md)

Note: Although you can run the app on a headless Raspberry Pi Device, this would defeat the original purpose of the app a bit, as it was designed for touchscreen capabilities.

For example you can have a spare Raspberry Pi tucked away somewhere in a cupboard, running the wiim-now-playing server, in order to keep tabs on what your WiiM device is playing. And for the client to have a browser tab open all day. Possibly even using the cheapest Android tablet you can find.

It is however totally possible to hook up an external screen directly to the Raspberry Pi over HDMI. After following the instructions below, you should then also follow the Kiosk mode instructions in order to show the output to the attached screen. Note that you also would need to have a keyboard and mouse attached for any interaction with the display.

Then again you already should have the WiiM Home app on your mobile device (phone or tablet) to control and see what it is playing.

## Usage scenarios

**Scenario 1**: You want to see from across the room what your WiiM device is playing now. You do not fancy all the touchscreen stuff and just want to see it on your TV.

## **The 'works-on-my-machine' short-hand-guide:**

1. Prepare a Raspberry Pi with or without any display attached. A display is not required for setup!  
2. Prepare a Raspberry Pi OS sd-card without a desktop i.e. the Lite version.  
   Make sure you can connect over the network, i.e. setup the Wifi during sd card initialisation.
3. Add the wiim-now-playing app over SSH.
4. Some Googling to fix 'this-and-that'.

For a more step-by-step process read below.

===

{TODO: basically follow the touchscreen setup, without the touchscreen stuff. Will try on a RPi Zero...}
{TODO: 'Headless' with HDMI output...}

===

{TODO: Point to KIOSK instructions...}
