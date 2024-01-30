// ===========================================================================
// lib.js
//
// Custom functionality module
// Contains generic functions to aid the server app

// Other modules
const log = require("debug")("lib:lib");

// Exports
module.exports = {

    getDate: () => { // Sample
        log("getDate")
        var date = new Date();
        return date.toUTCString();
    },

    getServerInfo: () => {
        var info = {
            "selectedDevice": {
                "location": "",
                "friendlyName": ""
            },
            "isPi": false
        }
        return info;
    }

};
