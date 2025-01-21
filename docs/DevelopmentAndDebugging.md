# Development and debugging this app

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

## Client side development

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

## Debugging the client

Use the developer tools in your browser to see what is happening currently and that your changes have the desired behaviour.  
Make sure that you are watching the Parcel development version (port 1234) and not the node server.

## Building the client

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
