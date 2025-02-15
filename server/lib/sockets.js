// ===========================================================================
// socket.js

/**
 * Socket.io functionality module.
 * Contains generic functions to aid the sockets in the app.
 * @module
 */

// Other modules
const lib = require("./lib.js"); // Generic functionality
const log = require("debug")("lib:sockets");

/**
 * This function provides a cleaned up array of found devices emitted to clients.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {array} deviceListSsdp - The array of found device objects through SSDP.
 * @param {array} deviceListManual - The array of manually added device objects.
 * @returns {undefined}
 */
const getDevices = (io, deviceListSsdp, deviceListManual) => {
    log("Device list requested. Through SSDP: " + deviceListSsdp.length + " Manual: " + deviceListManual.length);
    // Combine the SSDP and manual device lists
    let devicesMap = deviceListSsdp.map(d => ({
        "friendlyName": d.friendlyName,
        "manufacturer": d.manufacturer,
        "modelName": d.modelName,
        "location": d.location,
    }));
    devicesMap = devicesMap.concat(deviceListManual);
    io.emit("devices-get", devicesMap);
}

/**
 * This function sets a chosen device as the selected device based on location.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {array} deviceListSsdp - The array of found device objects through SSDP.
 * @param {array} deviceListManual - The array of manually added device objects.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @param {string} location - The device location uri.
 * @returns {undefined}
 */
const setDevice = (io, deviceListSsdp, deviceListManual, deviceInfo, serverSettings, location) => {
    log("Change selected device... (" + location + ")");
    let selDevice = deviceListSsdp.find(d => d.location === location);
    if (!selDevice) { // If not found in SSDP list, try the manual list
        selDevice = deviceListManual.find(d => d.location === location);
    }
    // Set the device, if found
    if (selDevice) {

        // Reset device info
        deviceInfo.state = null;
        deviceInfo.metadata = null;
        deviceInfo.client = null;

        // Set currently selected device
        serverSettings.selectedDevice = {
            "friendlyName": selDevice.friendlyName,
            "manufacturer": (selDevice.manufacturer) ? selDevice.manufacturer : null,
            "modelName": (selDevice.modelName) ? selDevice.modelName : null,
            "location": selDevice.location,
            "actions": (selDevice.actions) ? Object.keys(selDevice.actions) : null
        };

        io.emit("device-set", serverSettings.selectedDevice); // Send selected device props
        lib.saveSettings(serverSettings); // Make sure the settings are stored

    }
    else {
        log("Selected device not in found list!");
        io.emit("device-not-found", { location });
    }
}

/**
 * This function initiates the SSDP device discovery.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} ssdp - The SSDP module reference.
 * @param {array} deviceList - The array of found device objects.
 * @param {object} serverSettings - The server settings object.
 * @returns {undefined}
 */
const scanDevices = (io, ssdp, deviceList, serverSettings) => {
    log("Scanning for devices...");
    ssdp.scan(deviceList, serverSettings);
    io.emit("devices-refresh", "Scanning for devices...");
}

/**
 * This function gets the server settings.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} serverSettings - The server settings object.
 * @returns {undefined}
 */
const getServerSettings = (io, serverSettings) => {
    log("Get server settings...", "Device: " + serverSettings.selectedDevice.friendlyName);
    io.emit("server-settings", serverSettings);
}

module.exports = {
    getDevices,
    setDevice,
    scanDevices,
    getServerSettings,
};
