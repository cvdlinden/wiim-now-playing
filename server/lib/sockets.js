// ===========================================================================
// socket.js
//
// Socket.io functionality module
// Contains generic functions to aid the sockets in the app

// Other modules
const log = require("debug")("lib:sockets");

// Exports
module.exports = {

    startState: (io, device, serverSettings) => {
        log("Start streaming state...");
        // Start 'immediately' with a first package
        setTimeout(() => {
            io.emit("state", device.state);
        }, serverSettings.timeouts.immediate);
        // Then set an interval to stream the state
        return setInterval(() => {
            io.emit("state", device.state);
        }, serverSettings.timeouts.state);
    },

    stopState: (streamState) => {
        log("Stop streaming state!");
        clearInterval(streamState);
        return null;
    },

    startMetadata: (io, device, serverSettings) => {
        log("Start streaming metadata...");
        // Start 'immediately' with a first package
        setTimeout(() => {
            io.emit("metadata", device.metadata);
        }, serverSettings.timeouts.immediate);
        // Then set an interval to stream the metadata
        return setInterval(() => {
            io.emit("metadata", device.metadata);
        }, serverSettings.timeouts.metadata);
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
            "location": d.location,
            // "actions": Object.keys(d.actions)
        }));
        io.emit("devices-get", devicesList);
    },

    setDevice: (io, deviceList, deviceInfo, serverSettings, location) => {
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
            io.emit("device-set", serverSettings.selectedDevice);
            module.exports.getServerSettings(io, serverSettings);    
        }
        else {
            log("Selected device not in found list!");
        }
    },

    scanDevices: (io, ssdp, devices) => {
        log("Scanning for devices...");
        ssdp.rescan(devices);
        io.emit("devices-refresh", "Scanning for devices...");
    },

    getServerSettings: (io, serverSettings) => {
        log("Get server settings...");
        io.emit("server-settings", serverSettings);
    }

};
