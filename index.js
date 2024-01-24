const express = require("express");
const app = express();
const http = require("http");
const https = require("https");
const lib = require("./lib.js");

const server = http.createServer(app);

app.get('/', function (req, res) {
    var html = "<h1>Hello World!</h1>";
    html += "<div>" + lib.getResult("How are you?", "Doing") + "</div>";
    html += "<div>" + lib.getDate() + "</div>";
    res.send(html);
})

// Start the webserver and listen for traffic
server.listen(8080, () => {
    console.log("Web Server started at http://localhost:%s", server.address().port);
});
