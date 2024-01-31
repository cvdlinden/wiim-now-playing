// ===========================================================================
// index.js
//
// The server to handle communication between the selected media renderer and the ui client(s)

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
const xml2js = require("xml2js");
const ssdp = require("./lib/ssdp.js"); // SSDP functionality
const upnp = require("./lib/upnpClient.js"); // UPNP Client functionality
const sockets = require("./lib/sockets.js"); // Sockets.io functionality
const shell = require("./lib/shell.js"); // Shell command functionality
const lib = require("./lib/lib.js"); // Generic functionality
const log = require("debug")("index"); // See README.md on debugging

// ===========================================================================
// App variables
const port = 80; // Port 80 is the default www port, if the server won't start then choose another port i.e. 3000, 8000, 8080
var deviceList = []; // Placeholder for found devices through SSDP
var deviceInfo = { // Placeholder for device info
    transportInfo: null, // Keeps the current transport info
    metadata: null // Keeps the media metadata
};
var streamState = null; // Interval for current state of device
var streamMetadata = null; // Interval for current medio metadata from device
// var deviceState = { // Placeholder for current device state
//     // state: lib.getDate()
// };
// var deviceMetadata = { // Placeholder for current device metadata
//     "dc:title": "Foo",
//     "artist": "Bar",
//     "modes": [2, 4, 8, 16, 32, 64, 128, 256]
// }
var serverSettings = { // Placeholder for current server settings
    "selectedDevice": {
        "friendlyName": null,
        "manufacturer": null,
        "modelName": null,
        "location": null,
    },
    "os": lib.getOS()
}

// TODO: Move to upnpclient?
function updateDeviceState() {
    log("updateDeviceState");
    if (serverSettings.selectedDevice.location) {
        // log("DEVICE SELECTED")
        var client = upnp.createClient(serverSettings.selectedDevice.location);
        if (serverSettings.selectedDevice.actions.includes("GetTransportInfo")) {
            client.callAction(
                "AVTransport",
                "GetTransportInfo",
                { InstanceID: 0 },
                (err, result) => {
                    if (err) { 
                        log("GetTransportInfo error", err); 
                    }
                    else {
                        // log("GetTransportInfo result", result);
                        deviceInfo.transportInfo = {
                            ...result,
                            RelTime: (deviceInfo.metadata && deviceInfo.metadata.RelTime) ? deviceInfo.metadata.RelTime : null,
                            TimeStamp: (deviceInfo.metadata && deviceInfo.metadata.TimeStamp) ? deviceInfo.metadata.TimeStamp : null,
                            TrackDuration: (deviceInfo.metadata && deviceInfo.metadata.TrackDuration) ? deviceInfo.metadata.TrackDuration : null,
                            metadataTimeStamp: (deviceInfo.metadata && deviceInfo.metadata.metadataTimeStamp) ? deviceInfo.metadata.metadataTimeStamp : null,
                            stateTimeStamp: lib.getTimeStamp(),
                        };
                    }
                }
            );
        }
        client = null;
    }
    else {
        // log("No default device selected yet");
    };
};

function updateDeviceMetadata() {
    log("updateDeviceMetadata")
    if (serverSettings.selectedDevice.location) {
        // log("DEVICE SELECTED")
        var client = upnp.createClient(serverSettings.selectedDevice.location);
        if (serverSettings.selectedDevice.actions.includes("GetInfoEx")) {
            // GET "GetInfoEx";
            client.callAction(
                "AVTransport",
                "GetInfoEx",
                { InstanceID: 0 },
                (err, result) => {
                    if (err) {
                        log("GetInfoEx error", err);
                    }
                    else {
                        log("GetInfoEx result", result.CurrentTransportState);
                        const metadata = result.TrackMetaData;
                        if (metadata) {
                            const metaReq = xml2js.parseString(
                                metadata,
                                { explicitArray: false, ignoreAttrs: true },
                                (err, metadataJson) => {
                                    if (err) { log(err) }
                                    /* PlayMedium : SONGLIST-NETWORK / RADIO-NETWORK / STATION-NETWORK / UNKOWN
                                    *
                                    * TrackSource : Prime / Qobuz / SPOTIFY / newTuneIn / iHeartRadio / Deezer / UPnPServer
                                    *
                                    * LoopMode :
                                    * repeat / no shuffle 0
                                    * repeat 1 / no shuffle 1
                                    * repeat / shuffle 2
                                    * no repeat / shuffle 3
                                    * no repeat / no shuffle 4
                                    * repeat 1 / shuffle 5
                                    */

                                    mergeData = {
                                        trackMetaData: metadataJson["DIDL-Lite"]["item"],
                                        ...result,
                                        metadataTimeStamp: lib.getTimeStamp()
                                    };
                                    deviceInfo.metadata = mergeData;
                                }
                            );
                        }
                        else {
                            deviceInfo.metadata = result;
                        }
                    }
                }
            );
        }
        else {
            // GET "GetPositionInfo" and "GetTransportInfo"
        }
        client = null;
    }
    else {
        // log("No default device selected yet");
    };
};

// ===========================================================================
// Initial SSDP scan for devices
ssdp.scan(deviceList, serverSettings);

// ===========================================================================
// Set Express functionality
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
        // TODO: Move to upnpclient?
        updateDeviceState();
        pollState = setInterval(() => {
            updateDeviceState();
        }, 1000);
        // TODO: Move to upnpclient?
        updateDeviceMetadata();
        pollMetadata = setInterval(() => {
            updateDeviceMetadata();
        }, 5000);
        // Start streaming to client(s)
        streamState = sockets.startState(io, deviceInfo);
        streamMetadata = sockets.startMetadata(io, deviceInfo)
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
            // TODO: Move to upnpclient?
            if (pollState) { clearInterval(pollState) };
            if (pollMetadata) { clearInterval(pollMetadata) };
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
        log("Socket event", "devices-refresh...");
        sockets.scanDevices(io, ssdp, deviceList);
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

// ===========================================================================
// Set Express Routing (should be removed and served from static)
// TODO: Remove this debug part, moving to client side and node debug module
app.get('/debug', function (req, res) {

    log("Loading homepage...");
    var html = "<h1>Hello World!</h1>";
    html += "<div><strong>Now:</strong> <code>" + lib.getDate() + "</samp></code>";
    html += "<div><strong>Server Settings:</strong> <code>" + JSON.stringify(serverSettings) + "</code></div>";
    html += "<div><strong>Device locations:</strong> <code>" + JSON.stringify(deviceList.map(a => a.location)) + "</code></div>";
    // html += "<div><strong>Devices:</strong> <code>" + JSON.stringify(deviceList.map(d => ([d.friendlyName, d.manufacturer, d.modelName, d.location]))) + "</code></div>";
    html += "<div><strong>Devices:</strong><br /><textarea cols=\"80\" rows=\"12\">" + JSON.stringify(deviceList) + "</textarea></div>";
    res.send(html);
    log("Homepage sent");

});

// Start the webserver and listen for traffic
server.listen(port, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
