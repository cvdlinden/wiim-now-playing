// ===========================================================================
// upnp.js
//
// UPNP functionality module
// ASYNC!!!

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
        // Get the device description
        // client.getDeviceDescription(function (err, description) {
        //     if (err) throw err;
        //     log("getDeviceDescription", description.friendlyName);
        // });
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
