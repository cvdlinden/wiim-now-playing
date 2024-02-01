// ===========================================================================
// socket.js
//
// Socket.io functionality module
// Contains generic functions to aid the sockets in the app

// Other modules
const log = require("debug")("lib:sockets");

/**
 * This function starts the streaming of the selected device state to the clients.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const startState = (io, deviceInfo, serverSettings) => {
    log("Start streaming state...");
    // Start 'immediately' with a first package
    setTimeout(() => {
        io.emit("state", deviceInfo.state);
    }, serverSettings.timeouts.immediate);
    // Then set an interval to stream the state
    return setInterval(() => {
        io.emit("state", deviceInfo.state);
    }, serverSettings.timeouts.state);
}

/**
 * This function stops the streaming of the selected device state to the clients.
 * @param {object} interval - The set interval reference.
 * @returns {null} Null to mute the interval reference.
 */
const stopState = (interval) => {
    log("Stop streaming state!");
    clearInterval(interval);
    return null;
}

/**
 * This function starts the streaming of the selected device metadata to the clients.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const startMetadata = (io, deviceInfo, serverSettings) => {
    log("Start streaming metadata...");
    // Start 'immediately' with a first package
    setTimeout(() => {
        io.emit("metadata", deviceInfo.metadata);
    }, serverSettings.timeouts.immediate);
    // Then set an interval to stream the metadata
    return setInterval(() => {
        io.emit("metadata", deviceInfo.metadata);
    }, serverSettings.timeouts.metadata);
}

/**
 * This function stops the streaming of the selected device metadata to the clients.
 * @param {object} interval - The set interval reference.
 * @returns {null} Null to mute the interval reference.
 */
const stopMetadata = (interval) => {
    log("Stop streaming metadata!");
    clearInterval(interval);
    return null;
}

/**
 * This function provides a cleaned up array of found devices emitted to clients.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {array} deviceList - The array of found device objects.
 * @returns {undefined}
 */
const getDevices = (io, deviceList) => {
    log("Device list requested.");
    let devicesMap = deviceList.map(d => ({
        "friendlyName": d.friendlyName,
        "manufacturer": d.manufacturer,
        "modelName": d.modelName,
        "location": d.location,
        // "actions": Object.keys(d.actions)
    }));
    io.emit("devices-get", devicesMap);
}

/**
 * This function sets a chosen device as the selected device based on location.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {array} deviceList - The array of found device objects.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @param {string} location - The device location uri.
 * @returns {undefined}
 */
const setDevice = (io, deviceList, deviceInfo, serverSettings, location) => {
    log("Change selected device...");
    var selDevice = deviceList.filter((d) => { return d.location === location })
    if (selDevice.length > 0) {
        deviceInfo.state = null;
        deviceInfo.metadata = null;
        serverSettings.selectedDevice = {
            "friendlyName": selDevice[0].friendlyName,
            "manufacturer": selDevice[0].manufacturer,
            "modelName": selDevice[0].modelName,
            "location": selDevice[0].location,
            "actions": Object.keys(selDevice[0].actions)
        };
        io.emit("device-set", serverSettings.selectedDevice); // Send selected device props
    }
    else {
        log("Selected device not in found list!");
        // TODO: Should there be feedback to the clients?
        // io.emit("device-set", null);
    }
}

/**
 * This function initiates the SSDP device discovery.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} ssdp - The SSDP module reference.
 * @param {array} deviceList - The array of found device objects.
 * @returns {undefined}
 */
const scanDevices = (io, ssdp, deviceList) => {
    log("Scanning for devices...");
    ssdp.rescan(deviceList);
    io.emit("devices-refresh", "Scanning for devices...");
}

/**
 * This function gets the server settings.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} serverSettings - The server settings object.
 * @returns {undefined}
 */
const getServerSettings = (io, serverSettings) => {
    log("Get server settings...");
    io.emit("server-settings", serverSettings);
}

module.exports = {
    startState,
    stopState,
    startMetadata,
    stopMetadata,
    getDevices,
    setDevice,
    scanDevices,
    getServerSettings,
};
