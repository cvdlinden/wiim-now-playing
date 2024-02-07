// ===========================================================================
// test-upnp-avtransport.js

/**
 * This script will test the AVTransport 'Get...' capabilities of the found UPnP device.
 * 
 * It will connect to the device and get the device description
 * Then it will get all of the 'Get...' methods of the AVTransport service and output it results.
 * 
 * Replace the Client URI with the URI you've found on your local network.
 * Then run 'node _extras/test-upnp-avtransport.js' to see the results in the console.
 * 
 * Also see: https://www.npmjs.com/package/upnp-device-client
 */

let Client = require('upnp-device-client');

// Instantiate a client with a device description URL (discovered by SSDP)
// Replace the URI below with the found URI from discovery
let client = new Client('http://192.168.1.243:49152/description.xml');

// Get the device description
client.getDeviceDescription(function (err, description) {
    if (err) throw err;
    console.log("Device description -----------------------------------------------");
    console.log("friendlyName", description.friendlyName);
    console.log("manufacturer", description.manufacturer);
    console.log("modelName", description.modelName);
    // console.log("LOCATION", description.LOCATION);
    // console.log("getDeviceDescription", description);
});

// Get the devices AVTransport service description
client.getServiceDescription('AVTransport', function (err, description) {
    if (err) throw err;
    // console.log("getServiceDescription", description);
    console.log("AVTransport Actions ----------------------------------------------");
    Object.keys(description.actions).forEach((key) => {
        if (key.startsWith("Get")) {
            console.log("  Action:", key);
            client.callAction('AVTransport', key, { InstanceID: 0 }, function (err, result) {
                if (err) throw err;
                console.log(key + " = ", result);
            });
        }
        else {
            console.log("  Action:", key);
        };
    });
});

// Wait a minute for results to come in...
setTimeout(function () {
    console.log('Done!');
}, 60 * 1000);
