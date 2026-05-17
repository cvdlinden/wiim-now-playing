# General requirements for running the app

The general requirements are quite low. In order to run the WiiM Now Playing app, any computer with a browser will work. Be it Windows, MacOS or Linux.

Provided that:

* It is able to run [Node.js LTS (with npm)](https://nodejs.org/en).
* It has [Git](https://git-scm.com/) installed to fetch the repo.
* You are a bit familiar with the command prompt, terminal or bash shell.
  > [!TIP]
  > [PowerShell 7](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows) is recommended on Windows.
* Also see the [hardware requirements](../rpi/requirements.md), if you plan on running it on Raspberry Pi hardware.

## Check version info

```shell
# Check node and npm version
node -v
npm -v
```

Node should be somewhere in the 20+ range and Npm in the 10+ range.

```shell
# Check git version
git -v
```

Git should be somewhere above 2.5.
