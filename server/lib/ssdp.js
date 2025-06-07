// ===========================================================================
// ssdp.js
//

/**
 * SSDP functionality module.
 * The processes are asynchronous and take a while, so wait for results to come in.
 * @module
 */

// Use SSDP module
const SSDP = require("node-ssdp").Client

// Other modules
const upnp = require("./upnpClient.js"); // UPnP Client functionality
const log = require("debug")("lib:ssdp");

/**
 * This function starts a scan for devices and handles the reponse(s) by returning the result to the devices array.
 * @param {array} deviceList - The array of found device objects.
 * @param {object} serverSettings - The server settings object.
 * @returns {undefined}
 */
const scan = (deviceList, serverSettings) => {
    log("Scanning for devices with SSDP...");

    // Reset the already found device list by emptying the array first
    deviceList.length = 0;

    // Create client
    const ssdpClient = new SSDP({ explicitSocketBind: true }); // explicitSocketBind enabled to make it work on Windows 11

    // Event listener on responses from device discovery
    ssdpClient.on("response", (respSSDP, code, rinfo) => {
        // log("Fetching device info for:", respSSDP.LOCATION);

        if (deviceList.some((d) => { return d.location === respSSDP.LOCATION })) {
            log("Device already found!"); // No need to add this device
        }
        else {
            log("New device found! Getting details...");
            // log("Get the device description for:", respSSDP.LOCATION);
            upnp.getDeviceDescription(deviceList, serverSettings, respSSDP);
        };

    });

    // Start a UPnP/DLNA search
    // ssdpClient.search("ssdp:all"); // Search all devices
    // ssdpClient.search("urn:schemas-upnp-org:device:MediaRenderer"); // Search for MediaRenderer devices
    ssdpClient.search("urn:schemas-upnp-org:service:AVTransport:1"); // Search for AVTransport enabled devices

    // OpenHome. Discovery works, but talking to devices is different! -> TODO
    // There is an npm package: https://www.npmjs.com/package/openhome-devices-manager
    // ssdpClient.search("urn:av-openhome-org:service:Product:1"); // Search for OpenHome devices
    // ssdpClient.search("urn:av-openhome-org:service:Product:2"); // Search for OpenHome devices

}

module.exports = {
    scan
}