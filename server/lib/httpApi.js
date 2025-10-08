// ===========================================================================
// httpApi.js

/**
 * HTTP API functionality module - ASYNC!!!
 *
 * This module will handle the HTTP API requests to the WIIM device.
 * @module
 */

// Other modules
const lib = require("./lib.js"); // Generic functionality
const log = require("debug")("lib:httpApi");

// // Proxy requests to WiiM/Linkplay device
// app.use("/proxy-wiim", (req, res) => {
//   // Translate the /proxy uri to the corresponding /httpapi.asp?command=
//   let reqUrl = req.url;
//   reqUrl = reqUrl.replace("/", "/httpapi.asp?command=");
//   console.log("Call:", "https://" + config.deviceHost + reqUrl);

//   // Create a new HTTP client to forward the request to the WiiM/Linkplay device
//   const http_client = https.request({
//     host: config.deviceHost,
//     path: reqUrl,
//     method: req.method,
//     rejectUnauthorized: false, // Ignore self-signed certificate
//     headers: req.headers,
//     body: req.body
//   }, (resp) => {
//     // Forward the header response from the WiiM/Linkplay device
//     res.writeHead(resp.statusCode, resp.headers);
//     resp.pipe(res);
//   });

//   // Forward the body of the request to the WiiM/Linkplay device
//   req.pipe(http_client);

// });

/**
 * Proxy requests to WiiM/Linkplay device
 * @param {object} call - ...
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {string} cmd - The command to send to the device.
 * @param {object} serverSettings - The server settings object.
 * @returns {undefined}
 */
const proxyWiimRequest = (call, io, cmd, serverSettings) => {
    let ipAddress = lib.getIpAddressFromLocation(serverSettings);
    if (!ipAddress) {
        log("No IP address found for selected device.");
    }
    else {
        log("Proxy request to WiiM device at", ipAddress, "command:", cmd);
        let url = "https://" + ipAddress + "/httpapi.asp?command=" + encodeURIComponent(cmd);
        console.log("Proxy request to WiiM device:", url);
        io.emit(call, "This is a stub function.", cmd);
    }
}

/**
 * This function creates a stub.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {string} msg - The message to mirror.
 * @param {object} serverSettings - The server settings object.
 * @returns {object} The resulting object of the action (or null).
 */
const stub = (io, msg, serverSettings) => {
    log("Stub function called", msg);
    proxyWiimRequest("api-stub", io, msg, serverSettings);
}

module.exports = {
    stub
};