// ===========================================================================
// socket.js
//
// Socket.io functionality module
// Contains generic functions to aid the sockets in the app

// Other modules
const log = require("debug")("lib:sockets");

// Exports
module.exports = {

    startState: (io, deviceState) => {
        log("Start streaming state...");
        // Start 'immediately' with a first package
        setTimeout(() => {
            io.emit("state", deviceState);
        }, 250);
        // Then set an interval to stream the state
        return setInterval(() => {
            io.emit("state", deviceState);
        }, 1000);
    },

    stopState: (streamState) => {
        log("Stop streaming state!");
        clearInterval(streamState);
        return null;
    },

    startMetadata: (io, deviceMetadata) => {
        log("Start streaming metadata...");
        // Start 'immediately' with a first package
        setTimeout(() => {
            io.emit("metadata", deviceMetadata);
        }, 250);
        // Then set an interval to stream the metadata
        return setInterval(() => {
            io.emit("metadata", deviceMetadata);
        }, 5000);
    },

    stopMetadata: (streamMetadata) => {
        log("Stop streaming metadata!");
        clearInterval(streamMetadata);
        return null;
    },

    getDevices: (io, devices) => {
        log("Device list requested.");
        devicesList = devices.map(d => ({
            "friendlyName": d.friendlyName,
            "manufacturer": d.manufacturer,
            "modelName": d.modelName,
            "location": d.location
        }));
        io.emit("devices-get", devicesList);
    },

    scanDevices: (io, ssdp, devices) => {
        log("Scanning for devices...");
        ssdp.rescan(devices);
        io.emit("devices-refresh", "Scanning for devices...");
    },

    getServerSettings: (io, serverSettings) => {
        log("Get server settings...", serverSettings);
        io.emit("server-settings", serverSettings);
    }

};
