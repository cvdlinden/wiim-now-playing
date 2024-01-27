# Design

## Client/Server stack

- [Node.js & NPM](https://nodejs.org/en): The basics
- [Express](https://www.npmjs.com/package/express): HTTP handling  
  See <https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production>
- SSDP: Discovery of (Wiim) MediaRenderer devices on the network
- UPNP client: Talk to MediaRenderer devices on the network
- Socket.IO: Realtime connection between server and client
- Gulp?: Build tools
- Vue.js?: Client framework for presentation (or should I go with Angular?)
- [debug](https://www.npmjs.com/package/debug): To handle debug messages  
  See <https://expressjs.com/en/advanced/best-practice-performance.html#do-logging-correctly>
- PM2?: A process manager to handle automatic (re)starts of the application  
  See <https://expressjs.com/en/advanced/best-practice-performance.html#ensure-your-app-automatically-restarts>

## Other work/Examples/Inspiration

- <https://github.com/chrishuangcf/wiim-mini-ui>  
  This project has all the checkmarks, but it doesn't build on my machine. I.e. this is the main influence for this project.
- <https://github.com/sonydevworld/audio_control_api_examples/tree/master>  
  To read. Examples of talking to Sony equipment?
- <https://medium.com/@iaacek/vue-js-node-js-project-structure-51c27211ed2d>  
  Vue.js + Node.js project structure
