// ===========================================================================
// upnpClient.js

/**
 * UPnP functionality module - ASYNC!!!
 *
 * NOTE! We can't do a subscription on events as WiiM does not send any state variables (other than advertised LastChange).
 * Furthermore, the WiiM device really doesn't like setting up a subscription and will behave erratically -> Reboot WiiM
 * Seems we're bound to polling the current state every second or so.
 * TODO: Ask WiiM to implement UPnP subscriptions?
 * @module
 */

// Use upnp-device-client module
const UPnP = require("upnp-device-client");

// Other modules
const xml2js = require("xml2js");
const lib = require("./lib.js"); // Generic functionality
const lyrics = require("./lyrics.js"); // Lyrics functionality
const log = require("debug")("lib:upnpClient");

/**
 * This function creates the UPnP Device Client.
 * @param {string} rendererUri - The device renderer uri.
 * @returns {object} The UPnP Device Client object.
 */
// TODO: We're creating lots of new clients, can we have a global UPnP Client?
const createClient = (rendererUri) => {
    log("createClient()", rendererUri);
    return new UPnP(rendererUri);
}

/**
 * This function ensures a UPnP client is available in the global scope.
 * If not, it will create one. Note: Switching devices clears existing client (see sockets.js -> setDevice)
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {object} The restulting object of the action (or null).
 */
const ensureClient = (deviceInfo, serverSettings) => {
    // log("ensureClient()");
    if (!deviceInfo.client) {
        log("ensureClient()", "No client established yet, creating one ...");
        deviceInfo.client = createClient(serverSettings.selectedDevice.location);
    }
}

/**
 * This function starts the polling for the selected device state.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const startState = (io, deviceInfo, serverSettings) => {
    log("Start polling for device state...");

    // Start immediately with polling device for state
    module.exports.updateDeviceState(io, deviceInfo, serverSettings);
    // Then set an interval to poll the device state regularly
    return setInterval(() => {
        module.exports.updateDeviceState(io, deviceInfo, serverSettings);
    }, serverSettings.timeouts.state);

}

/**
 * This function starts the polling for the selected device metadata.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const startMetadata = (io, deviceInfo, serverSettings) => {
    log("Start polling for device metadata...");

    // Start immediately with polling device for metadata
    module.exports.updateDeviceMetadata(io, deviceInfo, serverSettings);
    // Then set an interval to poll the device metadata regularly
    return setInterval(() => {
        module.exports.updateDeviceMetadata(io, deviceInfo, serverSettings);
    }, serverSettings.timeouts.metadata);

}

/**
 * This function stops the polling of the selected device, given the interval.
 * @param {interval} interval - The set interval reference.
 * @param {string} name - The set interval name, for logging purposes only.
 * @returns {undefined}
 */
const stopPolling = (interval, name) => {
    log("Stop polling:", name);
    clearInterval(interval);
}

/**
 * This function fetches the current device state (GetTransportInfo).
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const updateDeviceState = (io, deviceInfo, serverSettings) => {
    // log("updateDeviceState()");

    if (serverSettings.selectedDevice.location &&
        serverSettings.selectedDevice.actions.includes("GetTransportInfo")) {
        ensureClient(deviceInfo, serverSettings);
        if (serverSettings.selectedDevice.actions.includes("GetTransportInfo")) {
            deviceInfo.client.callAction(
                "AVTransport",
                "GetTransportInfo",
                { InstanceID: 0 },
                (err, result) => { // Callback
                    if (err) {
                        log("updateDeviceState()", "GetTransportInfo error", err);
                        // TODO: If errors are persistent, what do we do? Change to any other available device?
                        // Device could be rebooting. Or turned off. Or disposed off, ...
                        // After x amount of polling should we give up? Stop polling and streaming?
                        // Or wait for the device to be turned on again?
                        // Or let the clients kindly know of a disruption? Could be the task of the client.
                    }
                    else {
                        log("updateDeviceState()", "GetTransportInfo:", result.CurrentTransportState);
                        deviceInfo.state = {
                            ...result,
                            RelTime: (deviceInfo.metadata && deviceInfo.metadata.RelTime) ? deviceInfo.metadata.RelTime : null,
                            TimeStamp: (deviceInfo.metadata && deviceInfo.metadata.TimeStamp) ? deviceInfo.metadata.TimeStamp : null,
                            TrackDuration: (deviceInfo.metadata && deviceInfo.metadata.TrackDuration) ? deviceInfo.metadata.TrackDuration : null,
                            PlayMedium: (deviceInfo.metadata && deviceInfo.metadata.PlayMedium) ? deviceInfo.metadata.PlayMedium : null,
                            metadataTimeStamp: (deviceInfo.metadata && deviceInfo.metadata.metadataTimeStamp) ? deviceInfo.metadata.metadataTimeStamp : null,
                            stateTimeStamp: lib.getTimeStamp(),
                        };
                        io.emit("state", deviceInfo.state);
                    }
                }
            );
        }
        // client = null;
    }
    else {
        log("updateDeviceState()", "Not able to get transport info for this device");
        deviceInfo.state = null;
        io.emit("state", deviceInfo.state);
    };

}

/**
 * This function fetches the current device metadate (GetInfoEx or GetPositionInfo).
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const updateDeviceMetadata = (io, deviceInfo, serverSettings) => {
    // log("updateDeviceMetadata()")

    if (serverSettings.selectedDevice.location) {
        ensureClient(deviceInfo, serverSettings);
        if (serverSettings.selectedDevice.actions.includes("GetInfoEx")) {
            deviceInfo.client.callAction(
                "AVTransport",
                "GetInfoEx",
                { InstanceID: 0 },
                (err, result) => { // Callback
                    if (err) {
                        log("updateDeviceMetadata()", "GetInfoEx error", err);
                        // May be a transient error, just wait a bit and carry on...
                    }
                    else {
                        log("updateDeviceMetadata()", "GetInfoEx:", result.RelTime);
                        const metadata = result.TrackMetaData;
                        if (metadata) {
                            const metaReq = xml2js.parseString(
                                metadata,
                                { explicitArray: false, ignoreAttrs: true },
                                (err, metadataJson) => {
                                    if (err) {
                                        log("updateDeviceMetadata()", err);
                                    }
                                    else {
                                        /**
                                         * Possible values
                                         * PlayMedium: SONGLIST-NETWORK, RADIO-NETWORK, STATION-NETWORK, CAST, AIRPLAY, SPOTIFY, OPTICAL, LINE-IN, HDMI, BLUETOOTH, UNKOWN
                                         * PlayMedia: NONE, STATION-NETWORK, SONGLIST-NETWORK, SONGLIST-LOCAL, SONGLIST-LOCAL_TF, THIRD-DLNA,AIRPLAY, UNKNOWN
                                         * CurrentTransportState : PLAYING, STOPPED, PLAYING, PAUSED_PLAYBACK, TRANSITIONING, NO_MEDIA_PRESENT
                                         * TrackSource : Prime, Qobuz, Spotify:..., newTuneIn, iHeartRadio, Deezer, UPnPServer, Tidal, vTuner
                                         */

                                        deviceInfo.metadata = {
                                            trackMetaData: (metadataJson["DIDL-Lite"] && metadataJson["DIDL-Lite"]["item"]) ? metadataJson["DIDL-Lite"]["item"] : null,
                                            ...result,
                                            metadataTimeStamp: lib.getTimeStamp()
                                        };;
                                        io.emit("metadata", deviceInfo.metadata);
                                        lyrics.getLyricsForMetadata(io, deviceInfo, serverSettings).catch((error) => {
                                            log("Lyrics update error", error);
                                        });
                                    }
                                }
                            );
                        }
                        else {
                            deviceInfo.metadata = {
                                ...result,
                                metadataTimeStamp: lib.getTimeStamp()
                            };
                            io.emit("metadata", deviceInfo.metadata);
                            lyrics.getLyricsForMetadata(io, deviceInfo, serverSettings).catch((error) => {
                                log("Lyrics update error", error);
                            });
                        }
                    }
                }
            );
        }
        else if (serverSettings.selectedDevice.actions.includes("GetPositionInfo")) {
            deviceInfo.client.callAction(
                "AVTransport",
                "GetPositionInfo",
                { InstanceID: 0 },
                (err, result) => { // Callback
                    if (err) {
                        log("updateDeviceMetadata()", "GetPositionInfo error", err);
                        // May be a transient error, just wait a bit and carry on...
                    }
                    else {
                        log("updateDeviceMetadata()", "GetPositionInfo:", result.RelTime);
                        const metadata = result.TrackMetaData;
                        if (metadata) {
                            const metaReq = xml2js.parseString(
                                metadata,
                                { explicitArray: false, ignoreAttrs: true },
                                (err, metadataJson) => {
                                    if (err) {
                                        log("updateDeviceMetadata()", err)
                                    }
                                    else {
                                        deviceInfo.metadata = {
                                            trackMetaData: metadataJson["DIDL-Lite"]["item"],
                                            ...result,
                                            metadataTimeStamp: lib.getTimeStamp()
                                        };
                                        io.emit("metadata", deviceInfo.metadata);
                                        lyrics.getLyricsForMetadata(io, deviceInfo, serverSettings).catch((error) => {
                                            log("Lyrics update error", error);
                                        });
                                    }
                                }
                            );
                        }
                        else {
                            deviceInfo.metadata = {
                                ...result,
                                metadataTimeStamp: lib.getTimeStamp()
                            };
                            io.emit("metadata", deviceInfo.metadata);
                            lyrics.getLyricsForMetadata(io, deviceInfo, serverSettings).catch((error) => {
                                log("Lyrics update error", error);
                            });
                        }
                    }
                }
            );
        }
        else {
            // Not able to fetch metadata either through GetInfoEx nor GetPositionInfo.
            deviceInfo.metadata = null;
        }
        // client = null;
    }
    else {
        log("updateDeviceMetadata()", "No default device selected yet");
        deviceInfo.metadata = null;
    };

}

/**
 * This function calls an action to perform on the device renderer.
 * E.g. "Next","Pause","Play","Previous","Seek".
 * See the selected device actions to see what the renderer is capable of.
 * @param {object} io - The Socket.IO object to emit to clients.
 * @param {string} action - The AVTransport action to perform.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {object} The resulting object of the action (or null).
 */
const callDeviceAction = (io, action, deviceInfo, serverSettings) => {
    log("callDeviceAction()", action);

    if (serverSettings.selectedDevice.location &&
        serverSettings.selectedDevice.actions.includes(action)) {

        let options = { InstanceID: 0 }; // Always required
        if (action === "Play") { options.Speed = 1 }; // Required for the Play action

        ensureClient(deviceInfo, serverSettings);
        deviceInfo.client.callAction(
            "AVTransport",
            action,
            options,
            (err, result) => { // Callback
                if (err) {
                    log("callDeviceAction()", "UPnP Error", err);
                }
                else {
                    log("callDeviceAction()", "Result", action, result);
                    io.emit("device-action", action, result);
                    // Update metadata info immediately
                    module.exports.updateDeviceMetadata(io, deviceInfo, serverSettings);
                    module.exports.updateDeviceState(io, deviceInfo, serverSettings);
                }
            }
        );

    }
    else {
        log("callDeviceAction()", "Device action cannot be executed!");
    };

}

/**
 * This function gets the device description.
 * @param {array} deviceList - The array of found device objects.
 * @param {object} serverSettings - The server settings object.
 * @param {object} respSSDP - The SSDP search response object.
 * @returns {object} The restulting object of the action (or null).
 */
const getDeviceDescription = (deviceList, serverSettings, respSSDP) => {
    // log("getDeviceDescription()");

    const deviceClient = createClient(respSSDP.LOCATION);
    deviceClient.getDeviceDescription(function (err, deviceDesc) {
        if (err) { log("getDeviceDescription()", "Error", err); }
        else {
            log("getDeviceDescription()", deviceDesc.friendlyName, deviceDesc.deviceType);

            if (deviceDesc.services["urn:upnp-org:serviceId:AVTransport"]) { // Does it support AVTransport?
                getServiceDescription(deviceList, serverSettings, deviceClient, respSSDP, deviceDesc);
            }
            else { // OpenHome device?
                // Get OpenHome service description...
                log("getDeviceDescription()", "OpenHome devices not implemented yet!")
            };

        };
    });

}

/**
 * This function gets the device service description.
 * @param {array} deviceList - The array of found device objects.
 * @param {object} serverSettings - The server settings object.
 * @param {object} deviceClient - The device client connection object. Not the same as the global UPnP client connection!
 * @param {object} respSSDP - The SSDP search response object.
 * @param {object} deviceDesc - The device description object, found by getDeviceDescription.
 * @returns {object} The restulting object of the action (or null).
 */
const getServiceDescription = (deviceList, serverSettings, deviceClient, respSSDP, deviceDesc) => {
    // log("getServiceDescription()");

    // Define device object
    let device = {
        location: respSSDP.LOCATION,
        ...deviceDesc,
        actions: {},
        ssdp: respSSDP
    };

    // Get AVTransport service description
    // Call is async, so we add the device in the callback
    deviceClient.getServiceDescription("AVTransport", function (err, serviceDesc) {
        if (err) {
            log("getServiceDescription('AVTransport')", "Error", err);

            // Just add the device without actions
            deviceList.push(device);
            log("getServiceDescription()", "Adding device without actions:", device.friendlyName);
            log("getServiceDescription()", "Total devices found:", deviceList.length);

            setDefaultSelectedDevice(serverSettings, device);

        }
        else {

            // Add actions to device object
            device.actions = serviceDesc.actions;

            deviceList.push(device);
            log("getServiceDescription()", "New device added:", device.friendlyName);
            log("getServiceDescription()", "Total devices found:", deviceList.length);

            setDefaultSelectedDevice(serverSettings, device);

        }
    });

}

/**
 * This function sets the default selected device, given the location uri.
 * Do we need to set the default selected device?
 * @param {array} serverSettings - The array of found device objects.
 * @param {object} device - The device info object.
 * @returns {undefined}
 */
const setDefaultSelectedDevice = (serverSettings, device) => {
    // If it is a WiiM device and no other has been selected yet, then make this the default selected device.
    // Or if the stored selected device corresponds to this device location, then just update with the latest info.
    if (((device.manufacturer.includes("Linkplay") || device.modelName.includes("WiiM")) && !serverSettings.selectedDevice.location)
        || (serverSettings.selectedDevice.location === device.location)) {
        serverSettings.selectedDevice = {
            "friendlyName": device.friendlyName,
            "manufacturer": device.manufacturer,
            "modelName": device.modelName,
            "location": device.location,
            "actions": Object.keys(device.actions)
        };
        lib.saveSettings(serverSettings); // Make sure the settings are stored
    };
}

module.exports = {
    createClient,
    startState,
    startMetadata,
    stopPolling,
    updateDeviceState,
    updateDeviceMetadata,
    callDeviceAction,
    getDeviceDescription,
    getServiceDescription
};
