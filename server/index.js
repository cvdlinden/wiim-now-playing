// ===========================================================================
// index.js
//
// The server to handle the communication between the selected media renderer and the ui client(s)

// Express modules
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
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
const httpApi = require("./lib/httpApi.js"); // HTTP API functionality
const sockets = require("./lib/sockets.js"); // Sockets.io functionality
const shell = require("./lib/shell.js"); // Shell command functionality
const lib = require("./lib/lib.js"); // Generic functionality
const lyrics = require("./lib/lyrics.js"); // Lyrics functionality
const lyricsCache = require("./lib/lyricsCache.js");
const log = require("debug")("index"); // See README.md on debugging

// For versionioning purposes
// Load the package.json files to get the version numbers
const packageJsonServer = require('../package.json'); // Server package.json
const packageJsonClient = require('../client/package.json'); // Client package.json

// ===========================================================================
// Server constants & variables

// Port 80 is the default www port, if the server won't start then choose another port i.e. 3000, 8000, 8080
// Use PORT environment variable or default to 80
log("process.env.PORT:", process.env.PORT);
const port = process.env.PORT || 80;

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
        "actions": {}
    },
    "os": lib.getOS(), // Initially grab the environment we are running in. Things may not have settled yet, so we update this later.
    "timeouts": {
        "immediate": 250, // Timeout for 'immediate' updates in milliseconds. Quarter of a second.
        "state": 1000, // Timeout for state updates in milliseconds. Every second.
        "metadata": 4 * 1000, // Timeout for metadata updates in milliseconds. Every 4 seconds.
        "rescan": 10 * 1000 // Timeout for possible rescan of devices in milliseconds. Every 10 seconds.
    },
    "features": {
        "lyrics": {
            "enabled": false,
            "provider": "lrclib",
            "offsetMs": 0,
            "cache": {
                "enabled": true,
                "maxSizeMB": 50,
                "prefetch": "album",
                "maxPrefetchConcurrency": 4
            }
        }
    },
    "server": null, // Placeholder for the express server (port) information
    "version": { // Version information for the server and client
        "server": packageJsonServer.version,
        "client": packageJsonClient.version
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
    log("Rescanning devices...");
    // Start new device scan, if first scan failed...
    if (deviceList.length === 0) {
        ssdp.scan(deviceList, serverSettings);
        // The client may not be aware of any devices and have an empty list, waiting for rescan results and send the device list again
        setTimeout(() => {
            sockets.getDevices(io, deviceList);
        }, serverSettings.timeouts.metadata)
    }
    // Node.js may have started before the wifi connection was established, so we rescan after a while
    serverSettings.os = lib.getOS(); // Update the OS information
    io.emit("server-settings", serverSettings); // And resend to clients
}, serverSettings.timeouts.rescan);

// ===========================================================================
// Set Express functionality
// Use CORS
app.use(cors());

// Set up rate limiter: maximum 100 requests per 15 minutes per IP
// As static file serving can be quite intensive we set a limit here
// As suggested by Github code scanning tools
// As suggested by: https://www.npmjs.com/package/express-rate-limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
});

// Apply rate limiter to static/file-serving routes
app.use(limiter);

// By default reroute all clients to the /public server folder
app.use(express.static(__dirname + "/public"));

// Exceptions:
app.get("/tv", limiter, function (req, res) { // TV Mode
    res.sendFile(__dirname + "/public/tv.html");
});
app.get("/debug", limiter, function (req, res) { // Debug page
    res.sendFile(__dirname + "/public/debug.html");
});
app.get("/res", limiter, function (req, res) { // Resolution test page
    res.sendFile(__dirname + "/public/res.html");
});
app.get("/assets", limiter, function (req, res) { // Assets test page
    res.sendFile(__dirname + "/public/assets.html");
});

// Proxy https album art requests through this app, because this could be a https request with a self signed certificate.
// If the device does not have a valid (self-signed) certificate the browser cannot load the album art, hence we ignore the self signed certificate.
app.get("/proxy-art", limiter, function (req, res) {
    log("Album Art Proxy request:", req.query.url, req.query.ts);

    // Validate URL
    let targetUrl;
    try {
        targetUrl = new URL(req.query.url);
    } catch (e) {
        res.status(400).send("<div>Invalid URL</div>");
        return;
    }
    if (targetUrl.protocol !== "https:") {
        res.status(400).send("<div>Invalid protocol</div>");
        return;
    }

    const options = {
        rejectUnauthorized: false, // Ignore self-signed certificate
    };

    https.get(targetUrl.href, options, (resp) => {
        // If the response is valid, pipe it to the client
        // Valid content-types could be: image/jpeg, image/png, image/webp, image/svg+xml, image/gif, etc.
        if (!resp.headers['content-type'] || !resp.headers['content-type'].startsWith('image/')) {
            res.status(415).send("<div>Unsupported Media Type</div>");
            return;
        }
        res.writeHead(resp.statusCode, resp.headers);
        resp.pipe(res);
    })
        .on('error', function (e) {
            res.status(404).send("<div>404 Not Found</div>");
        });

});

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
        if (deviceInfo.lyrics) {
            socket.emit("lyrics", deviceInfo.lyrics);
        }
        // }, serverSettings.timeouts.immediate)
    }

    /**
     * On client disconnect.
     * If no clients are connected stop polling and streaming.
     * @returns {undefined}
     */
    socket.on("disconnect", () => {
        log("Client disconnected");

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
     * Listener for device actions. I.e. Play, Stop, Pause, ...
     * @param {string} msg - The action to perform on the device.
     * @returns {undefined}
     */
    socket.on("device-action", (msg) => {
        log("Socket event", "device-action", msg);
        upnp.callDeviceAction(io, msg, deviceInfo, serverSettings);
    });

    /**
     * Listener for HTTP API commands.
     * @param {string} msg - The API command to perform on the device.
     * @returns {undefined}
     */
    socket.on("device-api", (msg) => {
        log("Socket event", "device-api", msg);
        httpApi.callApi(io, msg, serverSettings);
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
     * Listener for server settings updates.
     * @param {object} msg - The updated settings.
     * @returns {undefined}
     */
    socket.on("server-settings-update", (msg) => {
        log("Socket event", "server-settings-update", msg);
        if (msg && msg.features && msg.features.lyrics) {
            var shouldRefreshLyrics = false;
            if (typeof msg.features.lyrics.enabled === "boolean") {
                serverSettings.features.lyrics.enabled = msg.features.lyrics.enabled;
                shouldRefreshLyrics = true;
            }
            if (typeof msg.features.lyrics.offsetMs === "number") {
                serverSettings.features.lyrics.offsetMs = msg.features.lyrics.offsetMs;
            }
            if (msg.features.lyrics.cache) {
                if (typeof msg.features.lyrics.cache.enabled === "boolean") {
                    serverSettings.features.lyrics.cache.enabled = msg.features.lyrics.cache.enabled;
                }
                if (typeof msg.features.lyrics.cache.maxSizeMB === "number") {
                    serverSettings.features.lyrics.cache.maxSizeMB = Math.max(0, msg.features.lyrics.cache.maxSizeMB);
                }
                if (typeof msg.features.lyrics.cache.prefetch === "string") {
                    const prefetch = msg.features.lyrics.cache.prefetch;
                    if (prefetch === "off" || prefetch === "album") {
                        serverSettings.features.lyrics.cache.prefetch = prefetch;
                    }
                }
            }
            lib.saveSettings(serverSettings);
            sockets.getServerSettings(io, serverSettings);
            if (shouldRefreshLyrics) {
                lyrics.getLyricsForMetadata(io, deviceInfo, serverSettings).catch((error) => {
                    log("Lyrics update error", error);
                });
            }
        }
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

    /**
     * Listener for server update (git pull).
     * @returns {undefined}
     */
    socket.on("server-update", () => {
        log("Socket event", "server-update");
        shell.update(io);
    });

});

// Start the webserver and listen for traffic
server.listen(port, () => {
    serverSettings.server = server.address();
    console.log("Web Server started at http://localhost:%s", server.address().port);
});

const shutdownServer = (signal) => {
    log("Shutdown signal received:", signal);
    try {
        lyricsCache.closeCache();
    } finally {
        process.exit(0);
    }
};

process.on("SIGINT", () => shutdownServer("SIGINT"));
process.on("SIGTERM", () => shutdownServer("SIGTERM"));
