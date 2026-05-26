# Setting up a Raspberry Pi in headless mode

**Goal**: Get the wiim-now-playing app running on a somewhat recent Raspberry Pi device, without direct display output i.e. 'headless'. The Pi can then be put away out of sight. The output will be shown by external devices through means of a browser (on a mobile phone, tablet, TV, other computer, another Raspberry Pi, ...).

Which type of Raspberry Pi should I use? [See the Raspberry Pi requirements.](requirements.md)

> [!TIP]
> For setting up a Raspberry Device with a touchscreen see: [Setting up a Raspberry Pi in kiosk mode on a touchscreen](setup-touchscreen.md)

Note: Although you can run the app on a headless Raspberry Pi Device, this would defeat the original purpose of the app a bit, as it was designed for touchscreen capabilities.

For example you can have a spare Raspberry Pi tucked away somewhere in a cupboard, running the wiim-now-playing server, in order to keep tabs on what your WiiM device is playing. And for the client to have a browser tab open all day. Possibly even using the cheapest Android tablet you can find.

It is however totally possible to hook up an external screen directly to the Raspberry Pi over HDMI. After following the instructions below, you should then also follow the Kiosk mode instructions in order to show the output to the attached screen. Note that you also would need to have a keyboard and mouse attached for any interaction with the display.

Then again you already should have the WiiM Home app on your mobile device (phone or tablet) to control and see what it is playing.

## 1. Prepare an SD card with Raspberry Pi OS Lite

See: [Prepare a Raspberry Pi OS - SD card](prepare-sd-card.md)

## 2. Configure your Raspberry Pi OS through SSH

See: [First time configuration](first-time-config.md)

## 3. Add the wiim-now-playing solution to the RPi

See: [Add WNP to the Raspberry Pi](add-wnp-to-rpi.md)

## 4. Autostart the wiim-now-playing app on boot

See: [Auto-starting WNP](wnp-autostart.md)

The Raspberry Pi is now fully funtional with the wiim-now-playing app as long as you point a browser to it. Use your browser to point to the server e.g. ```wnp.local```.

## Adding a screen to the HDMI port (optional)

There's not a lot to show for on the screen itself if you add a screen to the HDMI port. Just a command prompt at this point!

To add the same output as in the browser on an attached screen, please follow the [Enable Kiosk mode on a Raspberry Pi](setup-kiosk.md) instructions.
