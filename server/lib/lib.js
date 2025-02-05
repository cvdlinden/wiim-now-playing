// ===========================================================================
// lib.js

/**
 * Custom functionality module.
 * Contains generic functions to aid the server app.
 * @module
 */

// Other modules
const os = require("os");
const fs = require("fs");
const log = require("debug")("lib:lib");
const path = require("path");

// Module constants
const settingsFile = path.join(__dirname, "..", "settings.json"); // Make absolute path to server folder

/**
 * This function provides the current date and time in UTC format.
 * @returns {string} The date in UTC format.
 */
const getDate = () => new Date().toUTCString();

/**
 * This function provides the current date and time in Unix epoch format.
 * @returns {number} The date in Unix epoch format.
 */
const getTimestamp = () => {
    return Date.now();
}

/**
 * This function provides the current OS environment information.
 * @returns {object} The object containing the OS information.
 */
const getOS = () => {
    log("os", "Get OS capabilities");
    return {
        "arch": os.arch(),
        "hostname": os.hostname(),
        "platform": os.platform(),
        "release": os.release(),
        "userInfo": os.userInfo(),
        "version": os.version(),
        "machine": os.machine(),
        "networkInterfaces": os.networkInterfaces()
    };
}

/**
 * This function fetches the stored settings if any.
 * If no settings file was found, it will create one.
 * If found, it will amend the current server settings.
 * @param {object} serverSettings - The reference to the server settings.
 * @returns {undefined}
 */
const getSettings = async (serverSettings) => {
    log("fs", "Get settings from:", settingsFile);

    // Try and read the settings file
    try {
        let settings = await fs.promises.readFile(settingsFile, "utf8");
        log("fs", "Settings file found! Processing...");
        settings = JSON.parse(settings);
        if (!settings.selectedDevice || !settings.selectedDevice.location) { // Short sanity check
            log("fs", "Previous selected device not stored correctly or invalid.");
            log("fs", "The file exists though. Silently ignoring, will be overwritten eventually...");
        }
        else {
            log("fs", "selectedDevice:", settings.selectedDevice.friendlyName, settings.selectedDevice.location);
            log("fs", "Amend the current server settings with the stored values.");
            serverSettings.selectedDevice = settings.selectedDevice;
        }
    }
    catch (err) { // Not found, create a settings file
        log("fs", "No settings file found! Trying to create one...");
        module.exports.saveSettings(serverSettings);
    }

}

/**
 * This function saves the current settings to filesystem.
 * It will overwrite the previous stored values.
 * @param {object} serverSettings - The reference to the server settings.
 * @returns {undefined}
 */
const saveSettings = async (serverSettings) => {
    log("fs", "Saving settings to:", settingsFile);

    const settingsToStore = {
        "selectedDevice": serverSettings.selectedDevice
    };
    log("fs", "Settings to store", settingsToStore);

    // Try and write the settings file
    try {
        await fs.promises.writeFile(settingsFile, JSON.stringify(settingsToStore), "utf8");
        log("fs", "Server settings saved to:", settingsFile);
    } catch (err) { // Unable to create settings file
        log("fs", "Error:", err);
    }

}

module.exports = {
    getDate,
    getTimestamp,
    getOS,
    getSettings,
    saveSettings
};
