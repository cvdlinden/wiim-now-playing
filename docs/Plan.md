# Plan

- [x] Create repo on Github for the project
- Create a solution that will:
  - [x] Create node.js app
  - [x] Create express server
  - [x] Create basic webpage and test functionality
  - [x] Create SSDP discovery to find eligible media renderers
  - [x] Create UPNP client to talk to media renderers
  - [x] Create Socket.IO to have realtime updates with client
  - [x] Use storage on server to remember app settings
  - [x] Make device switchable
  - [ ] Create app to talk to server and show/handle info dynamically
  - [ ] Also make use of OpenHome devices?
  - [ ] Use JSDoc for documentation generation?
  - [ ] Add a virtual keyboard to the client for touchscreen?
  - [ ] Create ...
  - ~~Use cookies to remember client settings~~

- [x] Solution will run on multiple enviroments, i.e. windows using a desktop browser and Raspberry Pi OS (Lite).
- [x] Solution will run on a Raspberry Pi with touch screen attached (DSI)
- [x] Create a Raspberry Pi with touch screen that loads a browser in kiosk mode, loading the app by default.
  - Raspberry Pi OS (Bullseye Lite)
    - Disable screensaver and lock screen
  - Touchscreen enabled
  - Autorun Chrome in kiosk mode
  - Autorun node.js
