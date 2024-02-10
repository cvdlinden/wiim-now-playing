# WiiM Now Playing

Show what the WiiM device is currently playing on a separate screen.

> In design/dev phase

![Preview screenshot](./assets/Screenshot%202024-02-10%20060442.png)  
*Preview screenshot*

![Preview screenshot](./assets/Screenshot%202024-02-10%20060156.png)  
*Preview screenshot*

![Preview settings](./assets/Screenshot%202024-02-08%20044241.png)  
*Preview settings*

## I just want it to run!

If you just want it to run and see what it does? Go to your command prompt!  
(If you don't know what a command prompt is, you shouldn't be here. As you will need it a lot!)

Provided that you already have the minimum up-to-date requirements for running it:

- Any type of computer (I think) installed with:
  - A browser
  - Node.js LTS (with npm)
  - Git
  - A command prompt (Powershell 7 is recommended on Windows)

Steps to run as fast as possible:

1. Open a (bash) command prompt, PowerShell or terminal window.
2. Use ``cd`` to navigate to any folder where you want everything placed. A users home dir (``cd ~``) or Temp folder is a good place. Up to you.
3. Clone this repo:

   ```shell
   git clone https://github.com/cvdlinden/wiim-now-playing.git
   ```

4. Use ``cd wiim-now-playing`` to move into the newly created folder.
5. Use ``npm install`` to get all of the dependencies and prepare for execution.  
   Tend to any errors! If anything pops up you could try the next step, but it is probably best to fix any beforehand.
6. Start the server with ``node server/index.js``. It should tell you where the server is running.  
  Copy-paste this url into your browser. Enjoy!  
7. Note: If the previous command crashes out, your system most probably does not allow running the server on http port 80. Could be the case if anything else is already running there.  
   Open up server/index.js in your favorite text editor and edit the value in ``const port = 80;``. Try ports 8000, 8080, 5000 or 3000 untill it no longer complains.

## Also see

- [Plan](docs/Plan.md)
- [Design](docs/Design.md)
- [Raspberry Pi Setup](docs/RPi-Setup.md)

## First time use

Use ``npm install`` to get all required packages after a fresh clone.

Start the server using ``node .\server\index.js`` to start an instance.  
Or use ``nodemon`` to start and keep monitoring.

## Development and debugging mode

Use ``nodemon`` to automatically reload the server on any changes you've made.

Debugging in Windows:

- In PowerShell use ``$env:DEBUG = "*"`` or ``$env:DEBUG = "*,-nodemon*"`` before starting ``nodemon`` to see all debugging information.
- In CMD use ``set DEBUG=*`` before starting ``nodemon`` to see all debugging information.
- In Shell/Bash use ``DEBUG="*" node server/index.js``.
- In order to stop debugging information change to ``DEBUG=""``.
- Use ``DEBUG="*,-nodemon*"`` to include all but nodemon module debug info.  
  Or use ``DEBUG="index"`` to only show debug info from the specific index.js module.

[Read more on DEBUG](https://www.npmjs.com/package/debug#windows-command-prompt-notes)
