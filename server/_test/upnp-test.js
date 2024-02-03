// See: https://www.npmjs.com/package/upnp-device-client

let Client = require('upnp-device-client');

// Instanciate a client with a device description URL (discovered by SSDP)
let client = new Client('http://192.168.1.243:49152/description.xml');
// let client = new Client('http://192.168.1.152:49152/uuid-7226dbfc-0701-f6bc-f8db-d83add8197a0/description.xml');
// let client = new Client('http://192.168.1.102:52323/MediaRenderer.xml');
// let client = new Client('http://192.168.1.137:52323/dmr.xml');

// Get the device description
client.getDeviceDescription(function (err, description) {
    if (err) throw err;
    console.log("getDeviceDescription", description.friendlyName);
    // console.log("getDeviceDescription", description);
});

// Get the device's AVTransport service description
client.getServiceDescription('AVTransport', function (err, description) {
    if (err) throw err;
    // console.log("getServiceDescription", description);
    Object.keys(description.actions).forEach((key) => {
        if (key.startsWith("Get")) {
            console.log("Action:", key);
            client.callAction('AVTransport', key, { InstanceID: 0 }, function (err, result) {
                if (err) throw err;
                console.log(key + " = ", result);
            });
        };
    });
});

// // Call GetMediaInfo on the AVTransport service
// client.callAction('AVTransport', 'GetMediaInfo', { InstanceID: 0 }, function (err, result) {
//     if (err) throw err;
//     console.log("GetMediaInfo", result); // => { NrTracks: '1', MediaDuration: ... }
// });

// // Call TransportStatus on the AVTransport service
// client.callAction('AVTransport', 'GetTransportInfo', { InstanceID: 0 }, function (err, result) {
//     if (err) throw err;
//     console.log("GetTransportInfo", result); // => { NrTracks: '1', MediaDuration: ... }
// });

// // Call TransportStatus on the AVTransport service
// client.callAction('AVTransport', 'GetPositionInfo', { InstanceID: 0 }, function (err, result) {
//     if (err) throw err;
//     console.log("GetPositionInfo", result); // => { NrTracks: '1', MediaDuration: ... }
// });

// Call TransportStatus on the AVTransport service
// client.callAction('AVTransport', 'GetInfoEx', { InstanceID: 0 }, function (err, result) {
//     if (err) throw err;
//     console.log("GetInfoEx", result); // => { NrTracks: '1', MediaDuration: ... }
// });

// DONT DO SUBSCRIPTIONS!
// let subEvents = function (e) {
//     // Will receive events like { InstanceID: 0, TransportState: 'PLAYING' } when playing media
//     console.log("subEvents", e);
// }
// client.subscribe('AVTransport', subEvents);

// let clientInterval = setInterval(() => {
//     console.log("CLIENT", client.subscriptions);
// }, 1000);

// client.unsubscribe('AVTransport', listener);

// Wait a bit for results to come in...
setTimeout(function () {
    // client.unsubscribe('AVTransport', subEvents);
    // clearInterval(clientInterval);
    console.log('Done!');
}, 60000);
