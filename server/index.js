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
    }
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
io.emit("debug", "SSDP start")
ssdp.scan(deviceList, serverSettings, io);
io.emit("debug", "SSDP started")

// ===========================================================================
// Set Express functionality, reroute all clients to the /public folder
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
        pollMetadata = upnp.startMetadata(deviceInfo, serverSettings);
        pollState = upnp.startState(deviceInfo, serverSettings);
        // Start streaming to client(s)
        streamState = sockets.startState(io, deviceInfo, serverSettings);
        streamMetadata = sockets.startMetadata(io, deviceInfo, serverSettings);
    }
    else if (io.sockets.sockets.size >= 1) {
        // If new client, send current state and metadata immediately
        io.emit("state", deviceInfo.state);
        io.emit("metadata", deviceInfo.metadata);
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
            // Stop streaming to client(s)
            sockets.stopStreaming(streamState, "streamState");
            sockets.stopStreaming(streamMetadata, "streamMetadata");
            // Stop polling the selected device
            upnp.stopPolling(pollState, "pollState");
            upnp.stopPolling(pollMetadata, "pollMetadata");
        }

    });

    // ======================================
    // State and Metadata related

    // /**
    //  * Listener for state refresh.
    //  * @returns {undefined}
    //  */
    // socket.on("state-refresh", () => {
    //     log("Socket event", "state");
    //     // TODO: immediately refresh state?
    //     // I.e. when transport state or media changes or new song has started... if possible. 
    //     // There's only a second to play with here. So may not be useful.
    //     io.emit("state", deviceInfo.state);
    // });

    // /**
    //  * Listener for metadata refresh.
    //  * @returns {undefined}
    //  */
    // socket.on("metadata-refresh", () => {
    //     log("Socket event", "metadata");
    //     // TODO: immediately refresh state?
    //     // I.e. when transport state or media changes or new song has started... if possible.
    //     // Worst case now, we have to wait 5 seconds to see any updated metadata.
    //     io.emit("metadata", deviceInfo.metadata);
    // });

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
        sockets.scanDevices(io, ssdp, deviceList);
    });

    /**
     * Listener for device selection.
     * @param {string} msg - The selected device location URI.
     * @returns {undefined}
     */
    socket.on("device-set", (msg) => {
        log("Socket event", "device-set", msg);
        sockets.setDevice(io, deviceList, deviceInfo, serverSettings, msg);
        // TODO: Make this async? To wait properly for state and metadata updates.
        // Immediately do a polling to the new device
        upnp.updateDeviceMetadata(deviceInfo, serverSettings);
        upnp.updateDeviceState(deviceInfo, serverSettings);
        // Then  wait a bit for the results to come in and tell the client.
        setTimeout(() => {
            io.emit("metadata", deviceInfo.metadata);
        }, serverSettings.timeouts.immediate);
        setTimeout(() => {
            io.emit("state", deviceInfo.state);
        }, serverSettings.timeouts.immediate);
    });

    /**
     * Listener for device interaction. I.e. Play, Stop, Pause, ...
     * Not yet implemented in client!
     * @param {string} msg - The action to perform on the device.
     * @returns {undefined}
     */
    socket.on("device-action", (msg) => {
        io.emit("device-action", msg); // Should be an action in sockets.js...
        // TODO: Make this async? To wait properly for state and metadata updates.
        // Immediately do a polling to the new device
        upnp.updateDeviceMetadata(deviceInfo, serverSettings);
        upnp.updateDeviceState(deviceInfo, serverSettings);
        // Then  wait a bit for the results to come in and tell the client.
        setTimeout(() => {
            io.emit("metadata", deviceInfo.metadata);
        }, serverSettings.timeouts.immediate);
        setTimeout(() => {
            io.emit("state", deviceInfo.state);
        }, serverSettings.timeouts.immediate);
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
