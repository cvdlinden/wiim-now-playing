# Setting up a Raspberry Pi in kiosk mode on a touchscreen

**Goal**: Start a somewhat recent Raspberry Pi device with browser in kiosk mode on the local (DSI) touchscreen display to show the wiim-now-playing app.

Which type of Raspberry Pi should I use? [See the Raspberry Pi requirements.](requirements.md)

> [!NOTE]
> For setting up a headless Raspberry Device see: [Setting up a Raspberry Pi in headless mode](setup-headless.md)

## 1. Prepare your Raspberry Pi with a touchscreen

First, make sure that your touchscreen works properly i.e. you have an image output and the touch input works.

1. Connect you Raspberry Pi to the touchscreen by following the instructions of the manufacturer.
2. Grab a copy of [Raspberry Pi OS](https://www.raspberrypi.com/software/), with the desktop, to check whether your RPi works with the screen attached. Use the [Raspberry Pi Imager](https://www.raspberrypi.com/software/) to download and write the OS to an SD card and insert the card into you RPi.
3. If the screen displays the Raspberry Pi OS Desktop, you are good to go.  
   If it doesn't display a desktop, please follow the manufacturers manual in order to activate the screen. You may need additional drivers for screen output.  
   Please take note of the instructions to enable the display as you will need them again later.

## 2. Prepare an SD card with Raspberry Pi OS Lite

See: [Prepare a Raspberry Pi OS - SD card](prepare-sd-card.md)

## 3. Configure your Raspberry Pi OS through SSH

See: [First time configuration](first-time-config.md)

## 4. Configuring the touchscreen

See: [Configuring the touchscreen](configure-touchscreen.md)

## 5. Add the wiim-now-playing solution to the RPi

See: [Add WNP to the Raspberry Pi](add-wnp-to-rpi.md)

## 6. Autostart the wiim-now-playing app on boot

See: [Auto-starting WNP](wnp-autostart.md)

## Showing the app on the touchscreen (enabling Kiosk mode)

Now that we've configured the RPi and the wiim-now-playing app (server part) to run every time the RPi (re)boots, we would like to show the client on the touchscreen as well. What else is the point of having the touchscreen attached? Currently there's not a lot to show for on the screen itself. Just a command prompt at this point.

To add the same output as in the browser on the touchscreen, please follow the [Enable Kiosk mode on a Raspberry Pi](setup-kiosk.md) instructions next.
