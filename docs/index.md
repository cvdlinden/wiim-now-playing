---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "WiiM Now Playing"
  text: "Show what your WiiM device is currently playing."
  tagline: "For use on a Raspberry Pi, with a touchscreen."
  image: 
    src: /logo.png
    alt: "wiim-now-playing logo"
  actions:
    - theme: brand
      text: Getting Started
      link: /getting-started/
    - theme: alt
      text: Installation on a Raspberry Pi
      link: /rpi/

features:
  - icon:
      src: /logo.png
    title: Getting Started
    details: "Start the WiiM Now Playing app, the easy way."
    link: /getting-started/
    linkText: "Let's go!"
  - icon:
      src: /logo.png
    title: On a Raspberry Pi
    details: "Install WiiM Now Playing on a Raspberry Pi. With or without a touchscreen."
    link: /rpi/
    linkText: "Install"
  # - title: Feature C
  #   details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  # - title: Feature A
  #   details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  # - title: Feature B
  #   details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  # - title: Feature C
  #   details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

## Getting a fast start

*Your mileage may vary...*

1. Open a (bash) command prompt, PowerShell or terminal window.
2. Make sure that you have somewhat recent (LTS) versions of [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/) installed:

   ```shell
   # Check node and npm version
   node -v
   npm -v

   # Check git version
   git -v
   ```

3. Run the following commands in order:

   ```shell
   # Move to your user folder or use a folder to your liking
   cd ~

   # Clone this repo
   git clone https://github.com/cvdlinden/wiim-now-playing.git

   # Move into the wiim-now-playing folder
   cd wiim-now-playing

   # Install the dependencies
   npm install

   # Start the WiiM Now Playing app
   node server/index.js

   # Open the provided URL, most likely: http://localhost:80
   # Start some tunes through the WiiM Home App and enjoy
   ```

> [!NOTE]
> If that doesn't work out-of-the-box? See the [Getting Started](getting-started/index.md) section.
