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
    if (cookies.Name === null) {
        cookies.Name = lib.setCookieVal(res, "Name", "wiim-now-playing")
    };
    cookies.RendererUri = lib.getCookieVal(req, "RendererUri");
    if (cookies.RendererUri === null) {
        // TODO
        // The client hasn't selected a MediaRender yet.
        // Select the first, or the one that is already selected?
        // cookies.RendererUri = lib.setCookieVal(res, "RendererUri", selRendererUri)
        cookies.RendererUri = lib.setCookieVal(res, "RendererUri", "")
    };
    // lib.clearCookies(req, res, cookies);

    log("Loading homepage");
    var html = "<h1>Hello World!</h1>";
    html += "<div>" + lib.getResult("How are you?", "Doing") + "</div>";
    html += "<div>" + lib.getDate() + "</div>";
    html += "<div>Device locations: " + JSON.stringify(devices.map(a => a.LOCATION)) + "</div>";
    html += "<div>Devics: " + JSON.stringify(devices) + "</div>";
    res.send(html);

    // ssdp.rescan(devices); // rescan for devices

});

// Start the webserver and listen for traffic
server.listen(8080, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
