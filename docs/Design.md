# Design

{Work in progress}

## Device - Server - Client model

**Server**:  
Handles all of the communication and translation between the selected device and connected clients.

The server talks to the device over UPnP to get the most recent device information. It does so by polling every second.

Note: The server will only talk to **one** MediaRenderer at the time!

**Device**:  
The UPnP MediaRenderer device we want to the 'Now Playing' information from.

The main goal is to talk to WiiM (Amp) devices. But if possible, not limited to this family of devices. Most people will have other UPnP MediaRenderers in their home, possibly without their knowing.

**Client(s)**:  
Mainly the client on the RPi itself to show the 'Now Playing' info on. But not limited to. Other clients can point their browser to the server and see the same information and control the server.

Note: Because the server will only communicate to one MediaRenderer at the time. All of the connected clients will be in sync with each other. I.e. switching a device on one client will make all other clients switch as well.

## Scope

The app **WILL**:

- Provide the basic 'Now Playing' functionality in a modern and sleek UI.  
  In such a manner that you can have it sit unobtrusively on your desk or cabinet for when something catches your attention.
  - It tells what song, artist and album are playing currently.
  - It show album art, if available.
  - It tells you what source is being used and in what quality.
- Provide the basic Pause/Play functionality. As it should be faster than reaching for your mobile device to do so.  
  Nice to haves are other basic commands like Next, Previous, Replay and if possible others.
- Be able to switch to other (WiiM) devices on the network.  
  Note: The app will only show the status of one device at a time! Get more RPi's if you want more.

The app **WILL NOT**:

- Be a replacement or try to mimic the full functionality of the [WiiM Home App](https://www.wiimhome.com/app) (nor [Volumio](https://volumio.com/get-started/) for that matter).  
  Stick to the WiiM Home app for:
  - Source selection and switching.
  - Music selection and playlists.
  - Device settings.
  - Volume control. Or just use the knob on your amp!
  - Any other thing you want to do with your (WiiM) device like multi-room stuff, equalisation, etc.

## Client-Server stack

The wiim-now-playing app is built using the following tools (may change over time):

Confirmed:

- [Node.js & NPM](https://nodejs.org/en): The basics
- [Express](https://www.npmjs.com/package/express): HTTP handling  
  Also see [Express.js: set-node_env-to-production](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production)
- [node-ssdp](https://www.npmjs.com/package/node-ssdp): Discovery of (Wiim) MediaRenderer devices on the network
- [upnp-device-client](https://www.npmjs.com/package/upnp-device-client): Talk to the (WiiM) MediaRenderer devices on the network
- [socket.io](https://www.npmjs.com/package/socket.io): Realtime connection between server and client
- [debug](https://www.npmjs.com/package/debug): To handle debug messages  
  Also see [Express.js: do-logging-correctly](https://expressjs.com/en/advanced/best-practice-performance.html#do-logging-correctly)
- fs: To add persistent storage to the server settings
- [xml2js](https://www.npmjs.com/package/xml2js): In order to parse any XML metadata, read: DIDL-Lite metadata
- [Bootstrap](https://getbootstrap.com/): Good ol' bootstrap for yer css needs. Note: This is just an include, not an npm package!

Possibly:

- Gulp/Webpack?: Build tools to pack css and js.

Not doing any time soon:

- Vue.js: Client framework for ui presentation
  - BootstrapVue vs Vuetify? <https://moiva.io/?npm=bootstrap-vue+vuetify>
  - Vue or Angular or React are overkill. Plain HTML/CSS/JS will suffice for now.
- PM2: A process manager to handle automatic (re)starts of the application  
  See <https://expressjs.com/en/advanced/best-practice-performance.html#ensure-your-app-automatically-restarts>
  - In case of errors, simply reboot the server. Testing and error handling are still in progress.
- Add a virtual keyboard? <https://github.com/Mottie/Keyboard>
  - No need for touchscreen input yet. Use a browser to point to the server if required.
- Use JSDoc for generation of documentation <https://github.com/jsdoc/jsdoc>
  - Not sure if there are any benefits at this stage.

## Other works/examples/inspiration/mentions

- <https://github.com/chrishuangcf/wiim-mini-ui>  
  This project has all the checkmarks, but it doesn't build on my machine.  
  Hence, this is the main influence for this project. Kudos, for making me pick up some old skills again and learning some new ones.
- <https://www.wiimhome.com>  
  Have heard good stuff about them, might check them out...
- <https://volumio.com/get-started/>  
  The excellent Volumio music player. If you're into Raspberry Pi's and music, have a look. Has served me well for years, but the Pi and cheap amp were showing their age.  
  Note: For full functionality you need to subscribe.
- <https://github.com/sonydevworld/audio_control_api_examples/tree/master>  
  To read. Examples of talking to Sony equipment?

- <https://medium.com/@iaacek/vue-js-node-js-project-structure-51c27211ed2d>  
  Vue.js + Node.js project structure.
- <https://bootstrap-vue.org/>  
  Good ol' Bootstrap... with a new backend.
