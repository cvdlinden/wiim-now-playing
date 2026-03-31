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

// Module constants
// Use /app/data/settings.json when running in Docker with a volume mount, otherwise fall back to server parent dir
const dataDir = __dirname + "/../../data";
const settingsFile = fs.existsSync(dataDir) ? dataDir + "/settings.json" : __dirname + "/../settings.json";

/**
 * This function provides the current date and time in UTC format.
 * @returns {string} The date in UTC format.
 */
const getDate = () => {
    const date = new Date();
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
 * This function extracts the IP address from the selected device location URL.
 * @param {object} serverSettings - The server settings object.
 * @returns {string|null} The IP address or null if not found.
 */
const getIpAddressFromLocation = (serverSettings) => {
    if (serverSettings.selectedDevice && serverSettings.selectedDevice.location) {
        const location = serverSettings.selectedDevice.location;
        const ip = location.split("/")[2].split(":")[0];
        return ip;
    }
    return null;
}

/**
 * This function fetches the stored settings if any.
 * If no settings file was found, it will create one.
 * If found, it will amend the current server settings.
 * @param {object} serverSettings - The reference to the server settings.
 * @returns {undefined}
 */
const getSettings = (serverSettings) => {
    log("fs", "Get settings from:", settingsFile);

    try { // Try and read the settings file
        let savedSettings = fs.readFileSync(settingsFile);
        log("fs", "Settings file found! Processing...");
        settingsParsed = JSON.parse(savedSettings);
        // log("fs", "settings:", settingsParsed);
        if (!settingsParsed.selectedDevice || !settingsParsed.selectedDevice.location || !settingsParsed.selectedDevice.actions) { // Short sanity check
            log("fs", "Previous selected device not stored correctly or invalid.");
            log("fs", "The file exists though. Silently ignoring, will be overwritten eventually...");
        }
        else {
            log("fs", "selectedDevice:", settingsParsed.selectedDevice.friendlyName, settingsParsed.selectedDevice.location);
            log("fs", "Amend the current server settings with the stored values.");
            serverSettings.selectedDevice = settingsParsed.selectedDevice;
        }
        // Merge the saved features settings.
        if (settingsParsed.features) {
            serverSettings.features = {
                ...serverSettings.features,
                ...settingsParsed.features
            };
            log("fs", "features:", serverSettings.features);
        }
    }
    catch (err) { // Not found, create a settings file
        log("fs", "No settings file found! Trying to create one...");
        saveSettings(serverSettings);
    }

}

/**
 * This function saves the current settings to filesystem.
 * It will overwrite the previous stored values.
 * @param {object} serverSettings - The reference to the server settings.
 * @returns {undefined}
 */
const saveSettings = (serverSettings) => {
    log("fs", "Saving settings to:", settingsFile);

    const settingsToStore = {
        "selectedDevice": serverSettings.selectedDevice,
        "features": serverSettings.features
    };
    log("fs", "Settings to store", settingsToStore);

    // Async
    fs.writeFile(settingsFile, JSON.stringify(settingsToStore), "utf8", (err) => {
        if (err) {
            log("fs", "Error:", err);
        } else {
            log("fs", "Server settings saved to:", settingsFile);
        }
    });

}

module.exports = {
    getDate,
    getTimeStamp,
    getOS,
    getIpAddressFromLocation,
    getSettings,
    saveSettings
};
