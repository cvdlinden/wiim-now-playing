// ===========================================================================
// index.js
//
// The server to handle the communication between the selected media renderer and the ui client(s)

// Express modules
const express = require("express");
const cors = require('cors');
const app = express();

// Node.js modules
const http = require("http");
const https = require("https");
const server = http.createServer(app);

// Socket.io modules, with CORS
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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
    metadata: null, // Keeps the device metadata updates
    client: null // Keeps the UPnP client object
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
        "metadata": 4 * 1000, // Timeout for metadata updates in milliseconds.
        "rescan": 10 * 1000 // Timeout for possible rescan of devices
    }
};

// Interval placeholders:
let pollState = null; // For the renderer state
let pollMetadata = null; // For the renderer metadata

// ===========================================================================
// Get the server settings from local file storage, if any.
lib.getSettings(serverSettings);

// ===========================================================================
// Initial SSDP scan for devices.
ssdp.scan(deviceList, serverSettings);

// Check after a while whether any device has been found.
// Due to wifi initialisation delay the scan may have failed.
// Not aware of a method of knowing whether wifi connection has been established fully.
setTimeout(() => {
    // Start new scan, if first scan failed...
    if (deviceList.length === 0) {
        ssdp.scan(deviceList, serverSettings);
        // The client may not be aware of any devices and have an empty list, waiting for rescan results and send the device list again
        setTimeout(() => {
            sockets.getDevices(io, deviceList);
        }, serverSettings.timeouts.metadata)
    }
}, serverSettings.timeouts.rescan);

// ===========================================================================
// Set Express functionality
// Use CORS
app.use(cors());
// Reroute all clients to the /public folder
app.use(express.static(__dirname + "/public"));
app.get('/debug', function (req, res) {
    res.sendFile(__dirname + "/public/debug.html");
})

// ===========================================================================
// Socket.io definitions

/**
 * On (new) client connection.
 * If first client to connect, then start polling and streaming.
 * @returns {undefined}
 */
io.on("connection", (socket) => {
    log("Client connected");

    // On connection check if this is the first client to connect.
    // If so, start polling the device and streaming to the device(s).
    log("No. of sockets:", io.sockets.sockets.size);
    if (io.sockets.sockets.size === 1) {
        // Start polling the selected device
        pollMetadata = upnp.startMetadata(io, deviceInfo, serverSettings);
        pollState = upnp.startState(io, deviceInfo, serverSettings);
    }
    else if (io.sockets.sockets.size >= 1) {
        // If new client, send current state and metadata 'immediately'
        // When sending directly after a reboot things get wonky
        // setTimeout(() => {
        socket.emit("state", deviceInfo.state);
        socket.emit("metadata", deviceInfo.metadata);
        // }, serverSettings.timeouts.immediate)
    }

    /**
     * On client disconnect.
     * If no clients are connected stop polling and streaming.
     * @returns {undefined}
     */
    socket.on("disconnect", () => {
        log('Client disconnected');

        // On disconnection we check the amount of connected clients.
        // If there is none, the streaming and polling are stopped.
        log("No. of sockets:", io.sockets.sockets.size);
        if (io.sockets.sockets.size === 0) {
            log("No sockets are connected!");
            // Stop polling the selected device
            upnp.stopPolling(pollState, "pollState");
            upnp.stopPolling(pollMetadata, "pollMetadata");
        }

    });

    // ======================================
    // Device(s) related

    /**
     * Listener for devices get.
     * @returns {undefined}
     */
    socket.on("devices-get", () => {
        log("Socket event", "devices-get");
        sockets.getDevices(io, deviceList);
    });

    /**
     * Listener for devices refresh.
     * @returns {undefined}
     */
    socket.on("devices-refresh", () => {
        log("Socket event", "devices-refresh");
        sockets.scanDevices(io, ssdp, deviceList, serverSettings);
    });

    /**
     * Listener for device selection.
     * @param {string} msg - The selected device location URI.
     * @returns {undefined}
     */
    socket.on("device-set", (msg) => {
        log("Socket event", "device-set", msg);
        sockets.setDevice(io, deviceList, deviceInfo, serverSettings, msg);
        // Immediately get new metadata and state from new device
        upnp.updateDeviceMetadata(io, deviceInfo, serverSettings);
        upnp.updateDeviceState(io, deviceInfo, serverSettings);
    });

    /**
     * Listener for device interaction. I.e. Play, Stop, Pause, ...
     * @param {string} msg - The action to perform on the device.
     * @returns {undefined}
     */
    socket.on("device-action", (msg) => {
        log("Socket event", "device-action", msg);
        upnp.callDeviceAction(io, msg, deviceInfo, serverSettings);
    });

    // ======================================
    // Server related

    /**
     * Listener for server settings.
     * @returns {undefined}
     */
    socket.on("server-settings", () => {
        log("Socket event", "server-settings");
        sockets.getServerSettings(io, serverSettings);
    });

    /**
     * Listener for server reboot.
     * @returns {undefined}
     */
    socket.on("server-reboot", () => {
        log("Socket event", "server-reboot");
        shell.reboot(io);
    });

    /**
     * Listener for server shutdown.
     * @returns {undefined}
     */
    socket.on("server-shutdown", () => {
        log("Socket event", "server-shutdown");
        shell.shutdown(io);
    });

});

// Start the webserver and listen for traffic
server.listen(port, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
