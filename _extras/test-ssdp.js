// ===========================================================================
// test-ssdp.js

/**
 * This script will test SSDP discovery.
 * 
 * It will try and find all UPnP devices on the current network.
 * Then it will output all found devices to a devices.csv file.
 */

const SSDP = require("node-ssdp").Client;
const ssdpClient = new SSDP({ explicitSocketBind: true }); // explicitSocketBind enabled to make it work on Windows 11

const fs = require("fs");
const csv = require("csv-stringify");

let devices = [];

ssdpClient.on("response", (respSSDP, code, rinfo) => {
    console.log("Device found ----------------------------------");
    console.log("IP:", rinfo.address);
    console.log("LOCATION:", respSSDP.LOCATION);
    console.log("ST:", respSSDP.ST);
    // console.log("Found:", respSSDP);
    devices.push(respSSDP);
});

// Start a search
ssdpClient.search("ssdp:all"); // Search all devices

// Wait a minute for results to come in...
setTimeout(function () {

    const stringifier = csv.stringify({
        header: true, // Add headers
        delimiter: ";" // Use ; as delimiter
    }); 

    console.log("Writing to devices.csv...");
    stringifier.pipe(fs.createWriteStream("devices.csv"));
    devices.forEach((row) => stringifier.write(row));
    stringifier.end();

    console.log("Done!");

}, 5 * 1000);
