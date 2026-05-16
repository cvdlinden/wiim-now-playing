# Developing Server Side components

## Server side development

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

## Server side debugging

If you want to know about the going-ons behind the scene:

- In PowerShell use ``$env:DEBUG = "*"`` or ``$env:DEBUG = "*,-nodemon*"`` before starting ``nodemon`` to see **all** debugging information.
- In CMD use ``set DEBUG=*`` before starting ``nodemon`` to see all debugging information.
- In Shell/Bash use ``DEBUG="*" node server/index.js`` on a single line.
- In order to stop debugging information change to ``DEBUG=""`` i.e. set the debug flag to empty.
- Use ``$env:DEBUG="*, -nodemon*, -engine*, -socket.*, -upnp-device*"`` as an example to get a more sane amount of debug information.  
  Or use ``$env:DEBUG="lib:upnpClient"`` specifically to only show debug info from the ``./lib/upnpClient.js`` module.

  > [Read more on DEBUG at npmjs.com](https://www.npmjs.com/package/debug#windows-command-prompt-notes)
