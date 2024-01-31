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

// Exports
module.exports = {

    createClient: (rendererUri) => {
        log("createClient", rendererUri);
        return new UPNP(rendererUri);
    },

    callAction: (client, action) => {
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
                log("callAction result", action, result)
                return result;
            }
        );
    },

    // Get the device's AVTransport service description
    getServiceDescription: (client) => {
        log("getServiceDescription");
        client.getServiceDescription('AVTransport', function (err, description) {
            // if (err) throw err;
            var availableActions = [];
            Object.keys(description.actions).forEach((key) => {
                availableActions.push(key);
            });
            log("availableActions", availableActions);
            return availableActions;
        });
    }

};
