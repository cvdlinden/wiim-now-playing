// ===========================================================================
// index.js

// Use Express module
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser"); // Used for remembering settings on the client

// Node.js modules
const http = require("http");
const https = require("https");
const server = http.createServer(app);

// Socket.io modules
const { Server } = require("socket.io");
const io = new Server(server);

// Other modules
const ssdp = require("./lib/ssdp.js"); // Lib for SSDP functionality
const lib = require("./lib/lib.js"); // Lib for custom functionality
const cookies = require("./lib/cookies.js"); // Lib for cookies functionality
// const upnp = require("./lib/_upnp.js"); // Lib for UPNP Client functionality
const log = require("debug")("index"); // See README.md on debugging

// ===========================================================================
// App variables
// ...

// ===========================================================================
// SSDP scan for devices initialisation
var devices = [];
ssdp.scan(devices);

// ===========================================================================
// Set Express functionality
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

// ===========================================================================
// Socket.io functionality
io.on("connection", (socket) => {

    log("client connected");

});

// ===========================================================================
// Set Express Routing (should be removed and served from static)
app.get('/debug', function (req, res) {

    // Handle cookies in order to use/store persistent client settings
    // Expected behaviour:
    // If a session is already running, the running session should take prevalence. And the newly joined client should adapt.
    // If no session is running, then use whatever the user has stored from a previous session.
    // If the first client has nothing stored, then default to the first found renderer.
    // This means that any second client should tag along. And if anyone of the clients switches, so does everybody else.
    log("Handling cookies...");
    var userCookies = cookies.getAll(req);
    // if (userCookies.Name == null || userCookies.Name !== "wiim-now-playing") {
    //     cookies.set(res, userCookies, "Name", "wiim-now-playing");
    // };
    if (userCookies.RendererUri == null) {
        // Selecting the first device found. Only valid on first startup. See above...
        cookies.set(res, userCookies, "RendererUri", devices[0].LOCATION);
    };
    log("userCookies", userCookies);

    // // Get UPNP info (=async)
    // var upnpClient = upnp.createClient(userCookies.RendererUri);
    // var rendererActions = upnp.getServiceDescription(upnpClient);
    // var rendererInfo = upnp.callAction(upnpClient, "GetInfoEx");

    log("Loading homepage...");
    var html = "<h1>Hello World!</h1>";
    html += "<div><strong>Now:</strong> <code>" + lib.getDate() + "</samp></code>";
    html += "<div><strong>Device locations:</strong> <code>" + JSON.stringify(devices.map(a => a.LOCATION)) + "</code></div>";
    html += "<div><strong>Devices:</strong> <code>" + JSON.stringify(devices.map(d => ([d.friendlyName[0], d.manufacturer[0], d.modelName[0], d.LOCATION]))) + "</code></div>";
    html += "<div><strong>Selected device:</strong> <code>" + userCookies.RendererUri + "</code></div>";
    // html += "<div><strong>Renderer actions:</strong> <code>" + rendererActions + "</code></div>";
    // html += "<div><strong>Renderer info:</strong> <code>" + rendererInfo + "</code></div>";
    res.send(html);
    log("Homepage sent");

    // ssdp.rescan(devices); // rescan for devices

});

// Start the webserver and listen for traffic
server.listen(8080, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
