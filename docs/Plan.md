# Plan

- [x] Create repo on Github
- Create a solution that will:
  - [x] Create node.js app
  - [x] Create express server
  - ~~Use cookies to remember client settings~~
  - [ ] Use storage on server to remember app settings
  - [x] Make device switchable
  - [x] Create SSDP discovery to find eligible media renderers
  - [x] Create UPNP client to talk to media renderers
  - [x] Create Socket.IO to have realtime updates with client
  - [x] Create basic webpage and test functionality
  - [ ] Create app to talk to server and show/handle info dynamically
  - [ ] Add a virtual keyboard to the client for touchscreen?
  - [ ] Use JSDoc for documentation generation?
  - [ ] Create ...

- [x] Solution will run on multiple enviroments, i.e. windows using a desktop browser and Raspberry Pi OS (Lite).
- [x] Solution will run on a Raspberry Pi with touch screen attached (DSI)
- [x] Create a Raspberry Pi with touch screen that loads a browser in kiosk mode, loading the app by default.
  - Raspberry Pi OS (Bullseye Lite)
    - Disable screensaver and lock screen
  - Touchscreen enabled
  - Autorun Chrome in kiosk mode
  - Autorun node.js
