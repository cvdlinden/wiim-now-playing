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

    isPi: () => {
        log("isPi?");
        // Do some checks whether this is running on a Raspberry Pi to be able to run shell commands
        // Returning false for now...
        return false;
    }

};
