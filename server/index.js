// Use Express module
const express = require("express");
const app = express();
// body-parser − This is a node.js middleware for handling JSON, Raw, Text and URL encoded form data.
// const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); // Used for remembering settings on the client

// Node.js modules
const http = require("http");
const https = require("https");

// Other modules
const ssdp = require("./lib/ssdp.js"); // Lib for SSDP functionality
const lib = require("./lib/lib.js"); // Lib for custom functionality
const log = require("debug")("index"); // See README.md on debugging

const server = http.createServer(app);

// ===========================================================================
// App variables
var cookies = {}

// ===========================================================================
// SSDP scan for devices initialisation
var devices = [];
ssdp.scan(devices);

// ===========================================================================
// Set Express functionality
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(cookieParser());

// Set Exress Routing
app.get('/', function (req, res) {

    // Handle cookies in order to store client settings
    cookies.Name = lib.getCookieVal(req, "Name");
    if (cookies.Name === null || cookies.Name === "") {
        cookies.Name = lib.setCookieVal(res, "Name", "wiim-now-playing")
    };
    cookies.RendererUri = lib.getCookieVal(req, "RendererUri");
    if (cookies.RendererUri === null || cookies.RendererUri === "") {
        // The client hasn't selected a MediaRenderer yet.
        // Selecting the first one found. (May want to change to Wiim specific.)
        cookies.RendererUri = lib.setCookieVal(res, "RendererUri", devices[0].LOCATION)
    };
    // lib.clearCookies(req, res, cookies);

    log("Loading homepage");
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
