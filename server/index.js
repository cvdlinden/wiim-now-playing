// ===========================================================================
// index.js
//
// The server to handle the communication between the selected media renderer and the ui client(s)

// Express modules
const express = require("express");
const app = express();

// Node.js modules
const http = require("http");
const https = require("https");
const server = http.createServer(app);

// Socket.io modules
const { Server } = require("socket.io");
const io = new Server(server);

// Other (custom) modules
const ssdp = require("./lib/ssdp.js"); // SSDP functionality
const upnp = require("./lib/upnpClient.js"); // UPnP Client functionality
const sockets = require("./lib/sockets.js"); // Sockets.io functionality
const shell = require("./lib/shell.js"); // Shell command functionality
const lib = require("./lib/lib.js"); // Generic functionality
const log = require("debug")("index"); // See README.md on debugging

// ===========================================================================
// Server constants & variables

const port = 80; // Port 80 is the default www port, if the server won't start then choose another port i.e. 3000, 8000, 8080

// Server side placeholders for data:
let deviceList = []; // Placeholder for found devices through SSDP
let deviceInfo = { // Placeholder for the currently selected device info
    state: null, // Keeps the device state updates
    metadata: null // Keeps the device metadata updates
};
let serverSettings = { // Placeholder for current server settings
    "selectedDevice": { // The selected device properties, a placeholder for now. Will be filled once a (default) device selection has been made.
        "friendlyName": null,
        "manufacturer": null,
        "modelName": null,
        "location": null,
        "actions": null
    },
    "os": lib.getOS(), // Grab the environment we are running in.
    "timeouts": {
        "immediate": 250, // Timeout for 'immediate' updates in milliseconds.
        "state": 1000, // Timeout for state updates in milliseconds.
        "metadata": 5000 // Timeout for metadata updates in milliseconds.
    },
    "ui": null // Placeholder for future UI settings
};

// Interval placeholders:
let streamState = null; // For current state of device
let streamMetadata = null; // For current medio metadata from device
let pollState = null; // For the renderer state
let pollMetadata = null; // For the renderer metadata

// ===========================================================================
// Get the server settings from local file storage, if any.
lib.getSettings(serverSettings);

// ===========================================================================
// Initial SSDP scan for devices.
ssdp.scan(deviceList, serverSettings);

// ===========================================================================
// Set Express functionality, reroute all clients to the /public folder
app.use(express.static(__dirname + "/public"));
app.get('/debug', function (req, res) {
    res.sendFile(__dirname + "/public/debug.html");
})

// ===========================================================================
// Socket.io definitions
io.on("connection", (socket) => {
    log("Client connected");

    // On connection check if this is the first client to connect.
    // If so, start polling the device and streaming to the device(s).
    log("No. of sockets:", io.sockets.sockets.size);
    if (io.sockets.sockets.size === 1) {
        // Start polling the selected device
        pollMetadata = upnp.startMetadata(deviceInfo, serverSettings);
        pollState = upnp.startState(deviceInfo, serverSettings);
        // Start streaming to client(s)
        streamState = sockets.startState(io, deviceInfo, serverSettings);
        streamMetadata = sockets.startMetadata(io, deviceInfo, serverSettings)
    }

    // On disconnect
    socket.on("disconnect", () => {
        log('Client disconnected');

        // On disconnection we check the amount of connected clients.
        // If there is none, the streaming and polling are stopped.
        log("No. of sockets:", io.sockets.sockets.size);
        if (io.sockets.sockets.size === 0) {
            log("No sockets are connected!");
            // Stop streaming to client(s)
            sockets.stopStreaming(streamState, "streamState");
            sockets.stopStreaming(streamMetadata, "streamMetadata");
            // Stop polling the selected device
            upnp.stopPolling(pollState, "pollState");
            upnp.stopPolling(pollMetadata, "pollMetadata");
        }

    });

    // ======================================
    // Devices related

    // On devices get
    socket.on("devices-get", () => {
        log("Socket event", "devices-get");
        sockets.getDevices(io, deviceList);
    });

    // On devices refresh
    socket.on("devices-refresh", () => {
        log("Socket event", "devices-refresh");
        sockets.scanDevices(io, ssdp, deviceList);
    });

    // On device selection
    socket.on("device-set", (msg) => {
        log("Socket event", "device-set", msg);
        sockets.setDevice(io, deviceList, deviceInfo, serverSettings, msg);
        // Immediately do a polling to the new device
        upnp.updateDeviceMetadata(deviceInfo, serverSettings);
        upnp.updateDeviceState(deviceInfo, serverSettings);
        setTimeout(() => {
            io.emit("metadata", deviceInfo.metadata);
        }, serverSettings.timeouts.immediate);
        setTimeout(() => {
            io.emit("state", deviceInfo.state);
        }, serverSettings.timeouts.immediate);
    });

    // ======================================
    // Server related

    // On server settings
    socket.on("server-settings", () => {
        log("Socket event", "server-settings");
        sockets.getServerSettings(io, serverSettings);
    });

    // On server reboot
    socket.on("server-reboot", () => {
        log("Socket event", "server-reboot");
        shell.reboot(io);
    });

    // On server shutdown
    socket.on("server-shutdown", () => {
        log("Socket event", "server-shutdown");
        shell.shutdown(io);
    });

});

// Start the webserver and listen for traffic
server.listen(port, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
