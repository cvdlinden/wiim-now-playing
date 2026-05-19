# Developing Client Side components

## Client side development server

> [!IMPORTANT]
> A pre-built client is available in the ```server/public``` folder.  
> Please do **not** edit these files as they are packed and minified using Parcel. Making them less usefull to read and decipher. And will be overwritten if you do follow the below procedure.  
> The client source files can be found in the ```client/src``` folder.

To start editing the client side of thing, first start a [server side development server](server.md) instance, then do the following:

1. Open another command prompt if you already have the server running.
2. If you haven't run the client side development server before, for a long while or just updated to the latest version.

   ```shell
   # Navigate to the wiim-now-playing folder, e.g.:
   cd wiim-now-playing
   
   # From the WNP folder navigate to the client folder
   cd client

   # Install dependencies for the client development
   npm install
   ```

3. Now start the client side development server to from either direct in the client folder or from the main wiim-now-playing folder.

   ::: code-group

   ```console [From main folder]
   ~/wiim-now-playing> npm run client-dev

   ...

   Server running at http://localhost:1234
   ✨ Built in 800ms
   ```

   ```console [From client folder]
   ~/wiim-now-playing/client> npm run start

   ...

   Server running at http://localhost:1234
   ✨ Built in 800ms
   ```

   :::

4. This will start another development server (Parcel) on port 1234.  
   Any modifications to files in the ```client/src``` folder will automatically show in your browser (Hot reload).

> [!NOTE]
> [Read more about Parcel on parceljs.org](https://parceljs.org/)

Note that you will need have the two server running during development.  
Port 80 for the server and port 1234 for the client.  
The client development server will need the server development server to communicate with the proper WiiM device data.

## Debugging the client

Please make sure that you are watching the Parcel development version (on port 1234) and not the node server (on port 80).

Use the available developer tools in your browser to see what is currently happening in the console or network and that your changes have the desired behaviour.

The app itself also provides a debug page to show you what your WiiM Device is currently telling the app. For this you can visit Settings > About > Show more debug information.

![Settings > About > Show more debug information](../assets/settings-about-debug.png)

Or add ```/debug``` to the end of the url.

The debug page will tell you what the WiiM Now Playing app currently knows about the media that is currently playing, the state, metadata, lyrics and more.

## Building the client

If you feel happy about your changes in the client development server, your changes will not be incorporated automatically in the main app. For this you need to build the client.

1. Close the client development server (CTRL+C)
2. Build the client using:

   ::: code-group

   ```shell [From main folder]
   npm run client-build
   ```

   ```shell [From client folder]
   npm run build
   ```

   :::

3. The newly built client will be placed in the ```server/public``` folder.  
   *Wiping any changes made there!*
4. If you still have the node server running, refresh the browser to see your changes in the default environment.
