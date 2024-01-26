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

// Other modules
const ssdp = require("./lib/ssdp.js"); // Lib for SSDP functionality
const lib = require("./lib/lib.js"); // Lib for custom functionality
const cookies = require("./lib/cookies.js"); // Lib for cookies functionality
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

// Set Exress Routing
app.get('/', function (req, res) {

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

    log("Loading homepage...");
    var html = "<h1>Hello World!</h1>";
    html += "<div>Now = " + lib.getDate() + "</div>";
    html += "<div>Device locations = " + JSON.stringify(devices.map(a => a.LOCATION)) + "</div>";
    html += "<div>Devices = " + JSON.stringify(devices) + "</div>";
    res.send(html);

    // ssdp.rescan(devices); // rescan for devices

});

// Start the webserver and listen for traffic
server.listen(8080, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
