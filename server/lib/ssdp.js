// ===========================================================================
// ssdp.js
//
// SSDP functionality module
// Use scan() to start scanning for devices.
// The processes are asynchronous, so wait for results to come in.

// Use SSDP module
const SSDP = require('node-ssdp').Client
const ssdpClient = new SSDP({ explicitSocketBind: true });

// Other modules
const http = require("http");
const xml2js = require("xml2js");
const log = require("debug")("lib:ssdp");

// Exports
module.exports = {

    // Starts a scan for devices and handles the reponse by returning the result to the devices array.
    scan: (devices) => {
        log("Scanning for devices with SSDP...");

        // Event listener on responses from device discovery
        ssdpClient.on("response", (respSSDP, code, rinfo) => {
            log("response", respSSDP);

            // Check the device properties by fetching the device XML description
            const deviceProps = http
                .get(respSSDP.LOCATION, function (respHTTP) {

                    log("Fetching device properties...");
                    var respCache = ""; // We need to cache all chunks

                    respHTTP.on("data", function (chunk) {
                        // log("HTTP response chunk received");
                        respCache += chunk;
                    });

                    respHTTP.on("end", function () {
                        // If response cache has been filled parse the XML result
                        const respXML = xml2js.parseString(
                            respCache,
                            (err, result) => {
                                if (err) {
                                    // throw err;
                                    log("XML parse error:", err);
                                }
                                else {

                                    devices.push({
                                        ...respSSDP,
                                        ...result.root.device[0]
                                    });
                                    // log("devices", devices);
                                    log("Devices", devices.map(d => ([ d.friendlyName[0], d.manufacturer[0], d.modelName[0], d.LOCATION ])));
                                    log("Devices found:", devices.length);

                                };
                            });
                    });

                })
                .on("error", function (e) {
                    log("There is an issue with the HTTP request: " + e);
                });

        });

        // Start a search
        // ssdpClient.search('ssdp:all'); // Search all devices
        // ssdpClient.search("urn:schemas-upnp-org:device:MediaRenderer"); // Search for MediaRenderer devices
        ssdpClient.search("urn:schemas-upnp-org:service:AVTransport:1"); // Search for AVTransport enabled devices

    },

    // Rescan for devices, clear devices list and search again.
    // Don't call this function within short intervals as it may lead to an erratic device list.
    rescan: (devices) => {
        log("Starting a rescan for devices...");
        devices.length = 0;
        // ssdpClient.search("urn:schemas-upnp-org:device:MediaRenderer"); // Search for MediaRenderer devices
        ssdpClient.search("urn:schemas-upnp-org:service:AVTransport:1"); // Search for AVTransport enabled devices
    }

}