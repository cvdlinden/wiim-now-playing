# Developing Server Side components

## Server side development server

When modifying any code in de ```server``` folder it is wise to start the app with ```nodemon``` for a development server.

This will monitor for any changes in the source code and automatically restarts your server.  Keep an eye on your command prompt to see the restarts or crashes.  

> [!NOTE]
> [Read more on Nodemon at GitHub](https://github.com/remy/nodemon)

```console
> nodemon
[nodemon] 3.1.14
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node server/index.js`
Web Server started at http://localhost:80
```

It will tell you where the app is running.

Alternatively use:

```shell
npm start
```

This will start nodemon as well.

And of course you can always start node manually using:

```shell
node server/index.js
```

But then you will then need to restart node yourself on any change or if it crashes.

## Server side debugging

By default you will not be alerted of anything going on in code, unless there is a crash.

If you want to know what the app is doing in your shell, you can set the DEBUG flag before starting nodemon.

::: code-group

```powershell [PowerShell]
# Set DEBUG flag to show all debugging info
$env:DEBUG="*"

# Set the DEBUG flag to show all debugging info, except nodemon itself
$env:DEBUG="*,-nodemon*"

# Set the DEBUG flag to show a sane amount of debug information, for example
$env:DEBUG="*, -nodemon*, -engine*, -socket.*, -upnp-device*"

# Set the DEBUG flag to show only debugging info from e.g. lib:upnpClient
# specifically from the /lib/upnpClient.js module.
$env:DEBUG="lib:upnpClient"

# Reset the DEBUG flag to keep silent
# i.e. set the debug flag to empty.
$env:DEBUG=""

# Start nodemon to see the debugging information
nodemon
```

```bash [Bash/Terminal]
# Set DEBUG flag to show all debugging info
DEBUG="*" node server/index.js

# Set the DEBUG flag to show all debugging info, except nodemon itself
DEBUG="*,-nodemon*" node server/index.js

# Set the DEBUG flag to show a sane amount of debug information, for example
DEBUG="*, -nodemon*, -engine*, -socket.*, -upnp-device*" node server/index.js

# Set the DEBUG flag to show only debugging info from e.g. lib:upnpClient
# specifically from the /lib/upnpClient.js module.
DEBUG="lib:upnpClient" node server/index.js

# Reset the DEBUG flag to keep silent
# i.e. set the debug flag to empty.
DEBUG="" node server/index.js
```

```bat [CMD]
:: Set DEBUG flag to show all debugging info
set DEBUG=*

:: Set the DEBUG flag to show all debugging info, except nodemon itself
set DEBUG=*,-nodemon*

:: Set the DEBUG flag to show a sane amount of debug information, for example
set DEBUG=*, -nodemon*, -engine*, -socket.*, -upnp-device*

:: Set the DEBUG flag to show only debugging info from e.g. lib:upnpClient
:: specifically from the /lib/upnpClient.js module.
set DEBUG=lib:upnpClient

:: Reset the DEBUG flag to keep silent
:: i.e. set the debug flag to empty.
set DEBUG=

:: Start nodemon to see the debugging information
nodemon
```

:::

> [!NOTE]
> [Read more on DEBUG at npmjs.com](https://www.npmjs.com/package/debug#windows-command-prompt-notes)
