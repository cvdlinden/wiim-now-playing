// ===========================================================================
// shell.js
//
// Shell functionality module
// Handle shell commands

// Other modules
const exec = require('child_process').exec;
const log = require("debug")("lib:shell");

// Exports
module.exports = {

    reboot: (io) => {
        log("Reboot requested...");
        exec('/usr/bin/sudo systemctl reboot', function (err, stdout, stderr) {
            if (err) {
                log("Error", err);
            }
            else {
                io.emit("server-reboot", "Rebooting...");
            }
        });
    },

    shutdown: (io) => {
        log("Shutdown requested...");
        exec('/usr/bin/sudo systemctl poweroff', function (err, stdout, stderr) {
            if (err) {
                log("Error", err);
            }
            else {
                io.emit("server-shutdown", "Shutting down...");
            }
        });
    }

}