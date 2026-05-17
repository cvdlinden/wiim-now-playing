# Design

## Client-Server stack

The wiim-now-playing app is built using the following tools (may change over time):

Confirmed:

- [Node.js & NPM](https://nodejs.org/en): The basics
- [Express](https://www.npmjs.com/package/express): HTTP handling  
  Also see [Express.js: set-node_env-to-production](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production)
- [node-ssdp](https://www.npmjs.com/package/node-ssdp): Discovery of (WiiM) MediaRenderer devices on the network
- [upnp-device-client](https://www.npmjs.com/package/upnp-device-client): Talk to the (WiiM) MediaRenderer devices on the network
- [socket.io](https://www.npmjs.com/package/socket.io): Realtime connection between server and client
- [debug](https://www.npmjs.com/package/debug): To handle debug messages  
  Also see [Express.js: do-logging-correctly](https://expressjs.com/en/advanced/best-practice-performance.html#do-logging-correctly)
- fs: To add persistent storage to the server settings
- [xml2js](https://www.npmjs.com/package/xml2js): In order to parse any XML metadata, read: DIDL-Lite metadata
- [Bootstrap](https://getbootstrap.com/): Good ol' bootstrap for yer css needs. Note: This is just an include, not an npm package!
- [Parcel.js](https://parceljs.org/): Used for client side development of the UI

Possibly:

- ...

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
  *Quit using this as there's no benefit at this moment.*
