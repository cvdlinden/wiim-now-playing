// ===========================================================================
// lib.js
//
// Custom functionality module
// Contains generic functions to aid the server app

// Other modules
const os = require("os");
const log = require("debug")("lib:lib");

// Exports
module.exports = {

    getDate: () => { // Sample
        log("getDate")
        var date = new Date();
        return date.toUTCString();
    },

    getOS: () => {
        log("get OS capabilities");
        return {
            "arch": os.arch(),
            "hostname": os.hostname(),
            "platform": os.platform(),
            "release": os.release(),
            "userInfo": os.userInfo(),
            "version": os.version(),
            "machine": os.machine()
        };
    }

};
