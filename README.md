# WiiM Now Playing

Show what the WiiM device is currently playing on a touchscreen, separate screen or browser.

Examples:

![Tidal High](./assets/Screenshot%202025-11-14%20010202.png)  
*Tidal Flac*

![Spotify](./assets/Screenshot%202025-11-14%20010622.png)  
*Spotify Lossless*

![TV Mode](./assets/Screenshot%202025-11-14%20011750.png)  
*TV Mode*

| *Device selection* | *Preset selection* | *Volume control* |
| :---: | :---: | :---: |
| ![Device selection](./assets/device-selection.png) | ![Preset selection](./assets/presets-selection.png) | ![Volume control](./assets/volume-control.png) |

![Settings](./assets/Screenshot%202025-11-14%20011033.png)  
*Settings*

## "I just want it to run, here and now!"

If you just want it to run and see what it does?

**Requirements**: Any computer with a browser, [Node.js LTS (with npm)](https://nodejs.org/en), [Git](https://git-scm.com/), a command prompt ([Powershell 7](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows) is recommended on Windows)

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
please read the installation instructions in [Raspberry Pi Setup - with touchscreen](docs/RPi-Setup.md)

You can run the wiim-now-playing app with a regular screen/monitor attached over the (micro) HDMI output of the Raspberry Pi. But then you would also need to add a mouse and keyboard as well in order to operate the device. Follow the 'headless' instructions below and then after configure it for kiosk mode.

The application can also be run headless i.e. without a monitor (or anything else) attached. Set the Raspberry Pi up this way and tuck it away somewhere out of sight. Point a browser from another device, i.e. a TV, to the server and see what's playing there.
For instructions see running a [Raspberry Pi Setup - headless](docs/RPi-Headless.md)

There are some hardware requirements, not a whole lot, see: [Raspberry Pi requirements for a wiim-now-playing setup](docs/RPi-Requirements.md)

## Debug logging

The server uses the [`debug`](https://www.npmjs.com/package/debug) module for lyrics/cache logging. To see those logs,
set the `DEBUG` environment variable before starting the server.

Examples:

```shell
# Only lyrics + cache logs
DEBUG=lib:lyrics,lib:lyrics-cache node server/index.js

# All library logs
DEBUG=lib:* node server/index.js
```

## "How do I update to the latest version?"

This depends on how you've installed WiiM Now Playing the first time.

### "I installed via Git"

If there's a new version of the app you can easily update it through Git.

1. Open a (bash) command prompt, PowerShell or terminal window.
2. Go into the wiim-now-playing folder, like: ``cd wiim-now-playing/``
3. Use the ``git pull`` command to get the latest version of the app. This will automatically download the latest version.
4. Then do an ``npm install`` to update any of the required packages.  
   *Please note that npm install may warn you about vulnerabilities and prompt you to run 'npm audit fix --force'. Please don't, as this will break functionality.*
5. For a proper update do a manual restart of node or just reboot the machine.

If ``git pull`` doesn't work as expected you probably have some locally changed files.  
Use ``git fetch`` then ``git status`` to check what files have changed locally.  
If you want to retain those changes then copy these files over to another folder, so you can redo your changes later on.  
Use e.g. ``git restore the-offending-file.js`` to undo the changes made for each file ``git status`` reports. Now you can do another ``git pull``.

### "I downloaded the ZIP package"

If you've installed by downloading the ZIP package before. You should be good by downloading the latest release from the [Releases page](https://github.com/cvdlinden/wiim-now-playing/releases) in this repo. Then unzip the downloaded ZIP package into the existing installation folder.

Please note that this will obviously overwrite anything already in the folder.  
So if you have made any changes of your own that you'd want to retain, please safeguard them beforehand!  
A good strategy would be to rename the existing folder and unzip the download into a new folder with the previous foldername. Then redo any of your desired changes.

After unzipping the download to your folder, go into the folder with ``cd`` and do an ``npm install`` to update any required packages.  
Afterwards restart node manually or do a reboot of the machine.

### "I forked your repo"

If you've forked this repo here on Github then please read the Github documentation on [Syncing a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork).

## "I want to use Docker and run it as virtual machine!"

If you want to use [Docker](https://www.docker.com/) instead of 'bare metal' on a Raspberry Pi, please use:

`docker-compose up -d --build`

> Please note that this will **only** run well on a Linux machine. The Windows version of Docker does not support device discovery over SSDP and thus will not scan the network for WiiM devices. You may need to spin up an entire Linux VM for this to work, which defeats the purpose of Docker.  
See: <https://github.com/cvdlinden/wiim-now-playing/pull/4>

If you already have a docker container running this app and want to do an update to the latest version, please use the ```docker-update.sh``` script.

## Also see

- [Development and Debugging](docs/DevelopmentAndDebugging.md)
- [Plan](docs/Plan.md)
- [Design](docs/Design.md)
