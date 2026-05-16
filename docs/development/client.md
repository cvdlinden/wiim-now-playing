# Developing Client Side components

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
