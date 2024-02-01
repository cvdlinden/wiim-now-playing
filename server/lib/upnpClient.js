// ===========================================================================
// upnp.js
//
// UPNP functionality module - ASYNC!!!
//
// NOTE! We can't do a subscription on events as WiiM does not send any state variables (other than advertised LastChange).
// Furthermore, the WiiM device really doesn't like setting up a subscription and will behave erratically -> Reboot WiiM
// Seems we're bound to polling the current state every second or so.
// TODO: Ask WiiM to implement UPNP subscriptions?

// Use upnp-device-client module
const UPNP = require("upnp-device-client");

// Other modules
const log = require("debug")("lib:upnp");

/**
 * This function creates the UPnP Device Client.
 * @param {string} rendererUri - The device renderer uri.
 * @returns {object} The UPnP Device Client object.
 */
const createClient = (rendererUri) => {
    log("createClient", rendererUri);
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
                log("UPNP Error", err);
                // throw err;
                return null;
            }
            // log("callAction result", action, result)
            return result;
        }
    );
}

module.exports = {
    createClient,
    callAction
};
