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
    scan: (devices, serverSettings) => {
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
                // TODO: Move to upnpClient.js?
                var client = upnp.createClient(respSSDP.LOCATION);
                client.getDeviceDescription(function (err, deviceDesc) {
                    if (err) { log("Error", err); }
                    else {

                        // Get the device's AVTransport service description
                        client.getServiceDescription('AVTransport', function (err, serviceDesc) {
                            if (err) { log("Error", err); }
                            else {

                                var device = {
                                    location: respSSDP.LOCATION,
                                    ...deviceDesc,
                                    actions: serviceDesc.actions,
                                    ssdp: respSSDP
                                };
                                devices.push(device);
                                log("Total devices found:", devices.length);
                                log("New device found:", {
                                    "friendlyName": device.friendlyName,
                                    "manufacturer": device.manufacturer,
                                    "modelName": device.modelName,
                                    "location": device.location
                                });

                                // Do we need to set the default selected device?
                                // If it is a WiiM device and no other has been selected, then yes.
                                if (!serverSettings.selectedDevice.location &&
                                    (device.manufacturer.includes("Linkplay") || device.modelName.includes("WiiM"))) {
                                    serverSettings.selectedDevice = {
                                        "friendlyName": device.friendlyName,
                                        "manufacturer": device.manufacturer,
                                        "modelName": device.modelName,
                                        "location": device.location,
                                        "actions": Object.keys(device.actions)
                                        // "actions": Object.keys(serviceDesc.actions)
                                    };
                                };

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

        // OpenHome?
        // const searchType1 = 'urn:av-openhome-org:service:Product:1';
        // const searchType2 = 'urn:av-openhome-org:service:Product:2';

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