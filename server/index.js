// ===========================================================================
// index.js
//
// The server to handle communication between the selected media renderer and the ui client(s)

// Express modules
const express = require("express");
const app = express();
// const cookieParser = require("cookie-parser"); // Used for remembering settings on the client

// Node.js modules
const http = require("http");
const https = require("https");
const server = http.createServer(app);

// Socket.io modules
const { Server } = require("socket.io");
const io = new Server(server);

// Other (custom) modules
const ssdp = require("./lib/ssdp.js"); // SSDP functionality
// const cookies = require("./lib/_cookies.js"); // Cookies functionality (need to rebuild for socket.io)
// const upnp = require("./lib/upnpClient.js"); // UPNP Client functionality
const sockets = require("./lib/sockets.js"); // Sockets.io functionality
const shell = require("./lib/shell.js"); // Shell command functionality
const lib = require("./lib/lib.js"); // Generic functionality
const log = require("debug")("index"); // See README.md on debugging

// ===========================================================================
// App variables
const port = 80;
var devices = []; // Placeholder for found devices through SSDP
var streamState = null; // Interval for current state of device
var streamMetadata = null; // Interval for current medio metadata from device
var deviceState = { // Placeholder for current device state
    state: lib.getDate()
};
var deviceMetadata = { // Placeholder for current device metadata
    "dc:title": "Foo",
    "artist": "Bar",
    "modes": [2, 4, 8, 16, 32, 64, 128, 256]
}

// TEMP UPDATE OF STATE (change value every 5 seconds, should come from device UPNP state)
setInterval(() => {
    deviceState.state = lib.getDate();
}, 5000);

// ===========================================================================
// Initial SSDP scan for devices
ssdp.scan(devices);

// ===========================================================================
// Set Express functionality
// app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

// ===========================================================================
// Socket.io functionality
// called for each HTTP request (including the WebSocket upgrade)

io.on("connection", (socket) => {
    log("Client connected");

    // On connection check if this is the first client to connect.
    // If so, start streaming to the device(s)
    log("No. of sockets:", io.sockets.sockets.size);
    if (io.sockets.sockets.size === 1) {
        streamState = sockets.startState(io, deviceState);
        streamMetadata = sockets.startMetadata(io, deviceMetadata)
    }

    // On disconnect
    socket.on("disconnect", () => {
        log('Client disconnected');

        // On disconnection we check the amount of connected clients.
        // If there is none, the streaming is stopped
        log("No. of sockets:", io.sockets.sockets.size);
        if (io.sockets.sockets.size === 0) {
            log("No sockets are connected!");
            streamState = sockets.stopState(streamState);
            streamMetadata = sockets.stopMetadata(streamMetadata);
        }

    });

    // On devices get
    socket.on("devices-get", () => {
        log("Socket event", "devices-get");
        sockets.getDevices(io, devices);
    });

    // On devices refresh
    socket.on("devices-refresh", () => {
        log("Socket event", "devices-refresh...");
        sockets.scanDevices(io, ssdp, devices);
    });

    // On device reboot
    socket.on("server-reboot", () => {
        log("Socket event", "server-reboot");
        io.emit("server-reboot");
        shell.reboot();
    });

    // On device reboot
    socket.on("server-shutdown", () => {
        log("Socket event", "server-shutdown");
        io.emit("server-shutdown");
        shell.shutdown();
    });

});

// ===========================================================================
// Set Express Routing (should be removed and served from static)
// TODO: Remove this debug part, moving to client side and node debug module
app.get('/debug', function (req, res) {

    // // Handle cookies in order to use/store persistent client settings
    // // Expected behaviour:
    // // If a session is already running, the running session should take prevalence. And the newly joined client should adapt.
    // // If no session is running, then use whatever the user has stored from a previous session.
    // // If the first client has nothing stored, then default to the first found renderer.
    // // This means that any second client should tag along. And if anyone of the clients switches, so does everybody else.
    // log("Handling cookies...");
    // var userCookies = cookies.getAll(req);
    // // if (userCookies.Name == null || userCookies.Name !== "wiim-now-playing") {
    // //     cookies.set(res, userCookies, "Name", "wiim-now-playing");
    // // };
    // if (userCookies.RendererUri == null) {
    //     // Selecting the first device found. Only valid on first startup. See above...
    //     cookies.set(res, userCookies, "RendererUri", devices.location);
    // };
    // log("userCookies", userCookies);

    // // Get UPNP info (=async)
    // var upnpClient = upnp.createClient(userCookies.RendererUri);
    // var rendererActions = upnp.getServiceDescription(upnpClient);
    // var rendererInfo = upnp.callAction(upnpClient, "GetInfoEx");

    log("Loading homepage...");
    var html = "<h1>Hello World!</h1>";
    html += "<div><strong>Now:</strong> <code>" + lib.getDate() + "</samp></code>";
    html += "<div><strong>Device locations:</strong> <code>" + JSON.stringify(devices.map(a => a.location)) + "</code></div>";
    html += "<div><strong>Devices:</strong> <code>" + JSON.stringify(devices.map(d => ([d.friendlyName, d.manufacturer, d.modelName, d.location]))) + "</code></div>";
    // html += "<div><strong>User selected device:</strong> <code>" + userCookies.RendererUri + "</code></div>";
    // html += "<div><strong>Renderer actions:</strong> <code>" + rendererActions + "</code></div>";
    // html += "<div><strong>Renderer info:</strong> <code>" + rendererInfo + "</code></div>";
    res.send(html);
    log("Homepage sent");

});

// Start the webserver and listen for traffic
server.listen(port, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
