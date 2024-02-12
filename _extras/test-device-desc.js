// ===========================================================================
// test-device-desc.js

/**
 * This script will try and find all services and their description of the device.
 */

const Client = require('upnp-device-client');

// Instantiate a client with a device LOCATION URL (discovered by SSDP)
// Replace the URI below with the found URI from discovery (use: node test-ssdp.js)
let client = new Client("http://192.168.1.243:49152/description.xml");

// Get the device description
client.getDeviceDescription(function (err, deviceDesc) {
    if (err) throw err;
    console.log("Device description -----------------------------------------------");
    console.log("friendlyName", deviceDesc.friendlyName);
    console.log("manufacturer", deviceDesc.manufacturer);
    console.log("modelName", deviceDesc.modelName);
    // console.log("LOCATION", deviceDesc.LOCATION);
    // console.log("getDeviceDescription", deviceDesc);

    // Go over the services
    Object.keys(deviceDesc.services).forEach((s) => {
        console.log("  Service:", s);

        client.getServiceDescription(s, function (err, serviceDesc) {
            console.log();
            console.log("Service description -----------------------------------------------");
            if (err) {
                console.log("Service cannot be reached:", s, err);
            }
            else {
                console.log("Service:", s)

                // Go over the service actions
                // console.log(serviceDesc.actions);
                Object.keys(serviceDesc.actions).forEach((a) => {
                    console.log("  Action:", a);

                    if (a.startsWith("Get") || a.startsWith("X_Get")) {
                        let options = { InstanceID: 0 };
                        if (a.startsWith("Read")) { options.Id = 0 }; // OpenHome
                        client.callAction(s, a, options, function (err, result) {
                            console.log();
                            console.log("Action description -----------------------------------------------");
                            console.log("Service:", s)
                            console.log("  Action:", a);
                            if (err) {
                                console.log("  Result = ERROR");
                            }
                            else {
                                console.log("  Result:", result);
                            }
                        });
                    }

                });

            }
        });

    })
});

// Wait a minute for results to come in...
setTimeout(function () {
    console.log('Done!');
}, 10 * 1000);
