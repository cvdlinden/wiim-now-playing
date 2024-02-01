// ===========================================================================
// lib.js
//
// Custom functionality module
// Contains generic functions to aid the server app

// Other modules
const os = require("os");
const log = require("debug")("lib:lib");

/**
 * This function provides the current date and time in UTC format.
 * @returns {string} The date in UTC format.
 */
const getDate = () => {
    var date = new Date();
    return date.toUTCString();
}

/**
 * This function provides the current date and time in Unix epoch format.
 * @returns {number} The date in Unix epoch format.
 */
const getTimeStamp = () => {
    return Date.now();
}

/**
 * This function provides the current OS environment information.
 * @returns {object} The object containing the OS information.
 */
const getOS = () => {
    log("Get OS capabilities");
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

module.exports = {
    getDate,
    getTimeStamp,
    getOS
};
