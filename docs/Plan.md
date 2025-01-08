# Plan

- [x] Create repo on Github for the project
- Create a solution that will:
  - [x] Create node.js app
  - [x] Create express server
  - [x] Create basic webpage and test functionality (debug page)
  - [x] Create SSDP discovery to find eligible media renderers
  - [x] Create UPnP client to talk to media renderers
  - [x] Create Socket.IO to have realtime updates with client
  - [x] Use storage on server to remember app settings
  - [x] Make device switchable
  - [x] Create an app to talk to server and show/handle info dynamically
  - [x] Implement Play/Pause functionality (CallAction method).
  - [x] Force state/metadata refresh when required. I.e. switching sources, switching devices, TransportState changes, ...
  - [x] Persistence of upnp client? Currently recreating for every call. Is this bothersome?
  - [x] Rethink device discovery and handling of found devices. (ssdp.js > upnpClient.js)
  - [x] Rework/refactor some functionality to async/await/callbacks/Promise. Too many setTimeouts for comfort.
  - [x] Check more streaming sources to make sense of their metadata.  
  - [ ] ...
  - ~~Use cookies to remember client settings~~
  - ~~Use JSDoc for documentation generation?~~
  - ~~Add a virtual keyboard to the client for touchscreen?~~

- [x] Solution will run on multiple enviroments, i.e. windows using a desktop browser and Raspberry Pi OS (Lite).
- [x] Solution will run on a Raspberry Pi with touch screen attached (DSI)
- [x] Create a Raspberry Pi with touch screen that loads a browser in kiosk mode, loading the app by default.
  - Raspberry Pi OS (Bullseye Lite)
    - Disable screensaver and lock screen
  - Touchscreen enabled
  - Autorun Chrome in kiosk mode
  - Autorun node.js

- [x] Change out rimraf and cash-cp to Shx <https://www.npmjs.com/package/shx>
- [ ] Add a 4K/High-res UI so you can switch when browsing on a TV.

(Possible) TODOs:

- Contingencies for when devices become unavailable? Network dropoffs/resets?  
  _Socket.IO already does a fine job with network interuptions_
- What kind of data is available when using other inputs on the WiiM Amp? Line In, Optical, HDMI, Bluetooth
- Subscription to WiiM devices apparently doesn't work?  
  _Ask WiiM/LinkPlay to implement?_
- Also make use of OpenHome devices? Discovery possible, not yet implemented. See: <http://wiki.openhome.org/wiki/OhMediaDevelopers>  
  _Implementation is totally different from WiiMs UPnP. Further research into long term storage._
