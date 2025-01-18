# WiiM Now Playing

Show what the WiiM device is currently playing on a separate screen.

![Tidal High](./assets/Screenshot%202024-02-12%20022212.png)  
*Tidal High quality*

![Tidal Flac](./assets/Screenshot%202024-02-12%20023330.png)  
*Tidal Flac*

![Spotify](./assets/Screenshot%202024-02-12%20021656.png)  
*Spotify*

![Settings](./assets/Screenshot%202024-02-12%20021621.png)  
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
   *Please note that npm install may warn you about vulnerabilities and prompt you to run 'npm audit fix --force'. Please don't, as this will break functionality. The issue is related to a package that another package is using. If you don't run this app on a public machine, but on your home network, you will be fine...*
6. Start the server with ``node server/index.js``. It should tell you where the server is running.  
  Copy-paste this url into your browser. Enjoy!  
7. Note: If the previous command crashes out, your system most probably does not allow running the server on http port 80.  
   This could be the case if you already have a webserver already running there.  
   Open up server/index.js in your favorite text editor and edit the value in ``const port = 80;``. Try ports 8000, 8080, 5000 or 3000 untill it no longer complains.

## 'I want to run it stand-alone on a Raspberry Pi (with touchscreen)'

If you want to run the wiim-now-playing app on a Raspberry Pi with a touchscreen,
please read the installation instructions in [Raspberry Pi Setup - with touchscreen](docs/RPi-Setup.md)

You can run the wiim-now-playing app with a regular screen/monitor attached over the (micro) HDMI output of the Raspberry Pi. But then you would also need to add a mouse and keyboard as well in order to operate the device. Follow the 'headless' instructions below and then configure it for kiosk mode.

The application can also be run headless i.e. without a monitor (or anything else) attached. Set the Raspberry Pi up this way and tuck it away somewhere out of sight. Point a browser from another device, i.e. a TV, to the server and see what's playing there.
For instructions see running a [Raspberry Pi Setup - headless](docs/RPi-Headless.md)

There are some hardware requirements, not a whole lot, see: [Raspberry Pi requirements for a wiim-now-playing setup](docs/RPi-Requirements.md)

## "I want to use docker!"

If you want to use [Docker](https://www.docker.com/) instead, please use:

`docker-compose up -d --build`

> Please note that this will **only** run well on a Linux machine. The Windows version of Docker does not support SSDP and will not scan the network for WiiM devices. You may need to spin up an entire Linux VM for this to work, which defeats the purpose of Docker.  
See: <https://github.com/cvdlinden/wiim-now-playing/pull/4>

## Also see

- [Plan](docs/Plan.md)
- [Design](docs/Design.md)

## Development and debugging mode

### Server side development

Use ``nodemon`` to automatically reload the server at any changes you've saved. Or use:

```shell
npm start
```

*This will start nodemon for you. Any changes made to the server sources will be picked up immediately.  
Keep an eye on your command prompt to see the restarts or crashes.*

Of course you can always start node manually using:

```shell
node server/index.js
```

*But then you will then need to restart node yourself on any change or if it crashes.*

### Server side debugging

If you want to know about the going-ons behind the scene:

- In PowerShell use ``$env:DEBUG = "*"`` or ``$env:DEBUG = "*,-nodemon*"`` before starting ``nodemon`` to see **all** debugging information.
- In CMD use ``set DEBUG=*`` before starting ``nodemon`` to see all debugging information.
- In Shell/Bash use ``DEBUG="*" node server/index.js`` on a single line.
- In order to stop debugging information change to ``DEBUG=""`` i.e. set the debug flag to empty.
- Use ``$env:DEBUG="*, -nodemon*, -engine*, -socket.*, -upnp-device*"`` as an example to get a more sane amount of debug information.  
  Or use ``$env:DEBUG="lib:upnpClient"`` specifically to only show debug info from the ``./lib/upnpClient.js`` module.

  > [Read more on DEBUG at npmjs.com](https://www.npmjs.com/package/debug#windows-command-prompt-notes)

### Client side development

A pre-built client is already available in the server/public folder. Please do not edit those sources as they are minified. The sources can be found in the client/src folder.

To edit the client:

1. Open another command prompt if you already have the server running.
2. Cd into the client folder: ``cd client``.
3. Run ``npm install`` in the client folder if you already haven't done so. This will install the client specific dependencies for development.
4. To start Parcel from the client folder:

   ```shell
   npm run start
   ```

   Note that you can also do this from the main WNP folder using:

   ```shell
   npm run client-dev
   ```

5. This will start another server (Parcel) on port 1234.  
   Any saved changes to the client sources will automatically show in your browser (Hot reload).  
   See the [Parcel site for more info](https://parceljs.org/)

*Note that you will have two server running during development. Port 80 for the server and port 1234 for the client.*

### Debugging the client

Use the developer tools in your browser to see what is happening currently and that your changes have the desired behaviour.  
Make sure that you are watching the Parcel development version (port 1234) and not the node server.

### Building the client

In order to incorporate your changes you can build the client.

1. Close the client development server (CTRL+C)
2. To build the client use:

   ```shell
   npm run build
   ```

   Note that you can also do this from the main WNP folder using:

   ```shell
   npm run client-build
   ```

3. The newly built client will be placed in the server/public folder.  
   *Wiping any changes made there!*
4. If you still have the node server running, refresh the browser to see your changes in the default environment.
