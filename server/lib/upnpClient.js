// ===========================================================================
// upnpClient.js

/**
 * UPNP functionality module - ASYNC!!!
 *
 * NOTE! We can't do a subscription on events as WiiM does not send any state variables (other than advertised LastChange).
 * Furthermore, the WiiM device really doesn't like setting up a subscription and will behave erratically -> Reboot WiiM
 * Seems we're bound to polling the current state every second or so.
 * TODO: Ask WiiM to implement UPNP subscriptions?
 * @module
 */

// Use upnp-device-client module
const UPNP = require("upnp-device-client");

// Other modules
const xml2js = require("xml2js");
const lib = require("./lib.js"); // Generic functionality
const log = require("debug")("lib:upnpClient");

/**
 * This function creates the UPnP Device Client.
 * @param {string} rendererUri - The device renderer uri.
 * @returns {object} The UPnP Device Client object.
 */
const createClient = (rendererUri) => {
    // log("createClient", rendererUri);
    return new UPNP(rendererUri);
}

/**
 * This function calls an action to perform on the device renderer.
 * E.g. "Next","Pause","Play","Previous","Seek".
 * See the selected device actions to see what the renderer is capable of.
 * @param {object} rendererUri - A UPnP Device Client object.
 * @param {string} action - The AVTransport action to perform.
 * @returns {object} The restulting object of the action (or null).
 */
const callAction = (client, action) => {
    log("callAction", action);
    client.callAction(
        "AVTransport",
        action,
        { InstanceID: 0 },
        (err, result) => {
            if (err) {
                log("callAction()", "UPNP Error", err);
            }
            else {
                log("callAction result", action, result)
                return result;
            }
        }
    );
}

/**
 * This function starts the polling for the selected device state.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const startState = (deviceInfo, serverSettings) => {
    log("Start polling for device state...");
    // Start immediately with polling device for state
    module.exports.updateDeviceState(deviceInfo, serverSettings);
    // Then set an interval to poll the device state regularly
    return setInterval(() => {
        module.exports.updateDeviceState(deviceInfo, serverSettings);
    }, serverSettings.timeouts.state);
}

/**
 * This function starts the polling for the selected device metadata.
 * @param {object} deviceInfo - The device info object.
 * @param {object} serverSettings - The server settings object.
 * @returns {interval} Interval reference.
 */
const startMetadata = (deviceInfo, serverSettings) => {
    log("Start polling for device metadata...");
    // Start immediately with polling device for metadata
    module.exports.updateDeviceMetadata(deviceInfo, serverSettings);
    // Then set an interval to poll the device metadata regularly
    return setInterval(() => {
        module.exports.updateDeviceMetadata(deviceInfo, serverSettings);
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
 * This function ...
 */
const updateDeviceState = (deviceInfo, serverSettings) => {
    log("updateDeviceState()");
    if (serverSettings.selectedDevice.location &&
        serverSettings.selectedDevice.actions.includes("GetTransportInfo")) {
        const client = module.exports.createClient(serverSettings.selectedDevice.location);
        if (serverSettings.selectedDevice.actions.includes("GetTransportInfo")) {
            client.callAction(
                "AVTransport",
                "GetTransportInfo",
                { InstanceID: 0 },
                (err, result) => {
                    if (err) {
                        log("updateDeviceState()", "GetTransportInfo error", err);
                        // If errors are persistent, what do we do? Change to any other available device?
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
                            metadataTimeStamp: (deviceInfo.metadata && deviceInfo.metadata.metadataTimeStamp) ? deviceInfo.metadata.metadataTimeStamp : null,
                            stateTimeStamp: lib.getTimeStamp(),
                        };
                        // log("updateDeviceState()","GetTransportInfo result", deviceInfo.state);
                    }
                }
            );
        }
        // client = null;
    }
    else {
        log("updateDeviceState()", "Not able to get transport info for this device");
        deviceInfo.state = null;
    };
}

/**
 * This function ...
 */
const updateDeviceMetadata = (deviceInfo, serverSettings) => {
    log("updateDeviceMetadata()")
    if (serverSettings.selectedDevice.location) {
        const client = module.exports.createClient(serverSettings.selectedDevice.location);
        if (serverSettings.selectedDevice.actions.includes("GetInfoEx")) {
            client.callAction(
                "AVTransport",
                "GetInfoEx",
                { InstanceID: 0 },
                (err, result) => {
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
                                        /* PlayMedium : SONGLIST-NETWORK / RADIO-NETWORK / STATION-NETWORK / UNKOWN
                                        *
                                        * TrackSource : Prime / Qobuz / SPOTIFY / newTuneIn / iHeartRadio / Deezer / UPnPServer
                                        *
                                        * LoopMode :
                                        * repeat / no shuffle 0
                                        * repeat 1 / no shuffle 1
                                        * repeat / shuffle 2
                                        * no repeat / shuffle 3
                                        * no repeat / no shuffle 4
                                        * repeat 1 / shuffle 5
                                        */

                                        deviceInfo.metadata = {
                                            trackMetaData: (metadataJson["DIDL-Lite"] && metadataJson["DIDL-Lite"]["item"]) ? metadataJson["DIDL-Lite"]["item"] : null,
                                            ...result,
                                            metadataTimeStamp: lib.getTimeStamp()
                                        };;
                                    }
                                }
                            );
                        }
                        else {
                            deviceInfo.metadata = {
                                ...result,
                                metadataTimeStamp: lib.getTimeStamp()
                            };
                        }
                    }
                }
            );
        }
        else if (serverSettings.selectedDevice.actions.includes("GetPositionInfo")) {
            client.callAction(
                "AVTransport",
                "GetPositionInfo",
                { InstanceID: 0 },
                (err, result) => {
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
                                    }
                                }
                            );
                        }
                        else {
                            deviceInfo.metadata = {
                                ...result,
                                metadataTimeStamp: lib.getTimeStamp()
                            };
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
        // log("No default device selected yet");
    };
}

module.exports = {
    createClient,
    callAction,
    startState,
    startMetadata,
    stopPolling,
    updateDeviceState,
    updateDeviceMetadata
};
