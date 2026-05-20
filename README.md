# WiiM Now Playing

<!-- Badges -->
[![Documentation](https://img.shields.io/badge/pages-Documentation-blue?logo=github)](https://cvdlinden.github.io/wiim-now-playing/)
![Version](https://img.shields.io/github/package-json/v/cvdlinden/wiim-now-playing)
[![Release](https://img.shields.io/github/v/release/cvdlinden/wiim-now-playing)](https://github.com/cvdlinden/wiim-now-playing/releases)
[![License](https://img.shields.io/github/license/cvdlinden/wiim-now-playing)](https://github.com/cvdlinden/wiim-now-playing/blob/main/LICENSE)

Show what the WiiM device is currently playing on a touchscreen, separate screen or browser.

Examples:

![Tidal High](./docs/assets/Screenshot%202025-11-14%20010202.png)  
*Tidal Flac*

![Spotify](./docs/assets/Screenshot%202025-11-14%20010622.png)  
*Spotify Lossless*

![TV Mode](./docs/assets/Screenshot%202025-11-14%20011750.png)  
*TV Mode*

| *Device selection* | *Preset selection* | *Volume control* |
| :---: | :---: | :---: |
| ![Device selection](./docs/assets/device-selection.png) | ![Preset selection](./docs/assets/presets-selection.png) | ![Volume control](./docs/assets/volume-control.png) |

![Settings](./docs/assets/Screenshot%202025-11-14%20011033.png)  
*Settings*

## "I just want it to run, here and now!"

Steps to run as fast as possible:

1. Open a (bash) command prompt, PowerShell or terminal window.
2. Use ``cd`` to navigate to any folder where you want everything placed. A users home dir (``cd ~``) or Temp folder is a good place. Up to you.
3. Clone this repo:

   ```shell
   git clone https://github.com/cvdlinden/wiim-now-playing.git
   ```

4. Use ``cd wiim-now-playing`` to move into the newly created folder.
5. Use ``npm install`` to get all of the dependencies and prepare for launch.  
   *Tend to any errors! If anything pops up you could try the next step, but it is probably best to fix any beforehand.*  
   *Please note that npm install may warn you about vulnerabilities and prompt you to run 'npm audit fix --force'. Please don't, as this will break functionality. The issue is related to a package that another package is using. If you don't run this app on a public machine, you should only run on your own home network, you will be fine...*
6. Start the server with ``node server/index.js``. It should tell you where the server is running.  
  Copy-paste this url into your browser. Enjoy!  
7. Note: If the previous command crashes out, your system most probably does not allow running the server on http port 80.  
   This could be the case if you already have a webserver running there.  
   Open up server/index.js in your favorite text editor and edit the value in ``const port = 80;``. Try ports 8000, 8080, 5000 or 3000 untill it no longer complains.

## "I want to run it stand-alone on a Raspberry Pi (with a touchscreen)!"

If you want to run the wiim-now-playing app on a Raspberry Pi with a touchscreen,
please read the installation instructions in [Raspberry Pi Setup - with touchscreen](docs/rpi/setup-touchscreen.md)

You can run the wiim-now-playing app with a regular screen/monitor attached over the (micro) HDMI output of the Raspberry Pi. But then you would also need to add a mouse and keyboard as well in order to operate the device. Follow the 'headless' instructions below and then after configure it for kiosk mode.

The application can also be run headless i.e. without a monitor (or anything else) attached. Set the Raspberry Pi up this way and tuck it away somewhere out of sight. Point a browser from another device, i.e. a TV, to the server and see what's playing there.
For instructions see running a [Raspberry Pi Setup - headless](docs/rpi/setup-headless.md)

There are some hardware requirements, not a whole lot, see: [Raspberry Pi requirements for a wiim-now-playing setup](docs/rpi/requirements.md)

## "I want to change things up!"

Current development:

- [Development and Debugging the WNP app](docs/development/DevelopmentAndDebugging.md)
- [Outstanding issues](https://github.com/cvdlinden/wiim-now-playing/issues)
- [Outstanding PRs](https://github.com/cvdlinden/wiim-now-playing/pulls)

History:

- [Original Plan](docs/reference/plan.md)
- [Original Design](docs/reference/design.md)
