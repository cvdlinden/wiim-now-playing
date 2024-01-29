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
// const http = require("http");
// const xml2js = require("xml2js");
const upnp = require("./upnpClient.js"); // UPNP Client functionality
const log = require("debug")("lib:ssdp");

// Exports
module.exports = {

    // Starts a scan for devices and handles the reponse by returning the result to the devices array.
    scan: (devices) => {
        log("Scanning for devices with SSDP...");

        // Event listener on responses from device discovery
        ssdpClient.on("response", (respSSDP, code, rinfo) => {
            log("Fetching:", respSSDP.LOCATION);

            if (devices.some((d) => { return d.location === respSSDP.LOCATION })) {
                log("Device already found!");
                // No need to add this device
            }
            else {
                log("New device found. Get the device description...");
                // Check the device description
                var client = upnp.createClient(respSSDP.LOCATION);
                client.getDeviceDescription(function (err, deviceDesc) {
                    if (err) { log("Error", err); }
                    else {

                        // Get the device's AVTransport service description
                        client.getServiceDescription('AVTransport', function (err, serviceDesc) {
                            if (err) { log("Error", err); }
                            else {
                                devices.push({
                                    location: respSSDP.LOCATION,
                                    ...deviceDesc,
                                    AVTransport: serviceDesc.actions,
                                    ssdp: respSSDP
                                });
                                log("Devices found:", devices.length, devices.map(d => ([d.friendlyName, d.manufacturer, d.modelName, d.location])));
                            };
                        });

                    };
                });

            };

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