# Plan

- [x] Create repo on Github for the project
- Create a solution that will:
  - [x] Create node.js app
  - [x] Create express server
  - [x] Create basic webpage and test functionality (debug page)
  - [x] Create SSDP discovery to find eligible media renderers
  - [x] Create UPNP client to talk to media renderers
  - [x] Create Socket.IO to have realtime updates with client
  - [x] Use storage on server to remember app settings
  - [x] Make device switchable
  - [x] Create an app to talk to server and show/handle info dynamically
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

TODOs:

- Implement Play/Pause functionality (CallAction method).
- Rework/refactor some functionality to async/await. Too many setTimeouts for comfort.
- Force state/metadata refresh when required. I.e. switching sources, switching devices, TransportState changes, ...
- Contingencies for when devices become unavailable? Network dropoffs/resets?
- Rethink device discovery and handling of found devices. (ssdp.js > upnpClient.js)
- Persistence of upnp client? Currently recreating for every call. Is this bothersome?
- Check more streaming sources to make sense of their metadata.
- Also make use of OpenHome devices?
- Subscription to WiiM devices apparently doesn't work?
