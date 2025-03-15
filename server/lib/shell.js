// ===========================================================================
// shell.js

/**
 * Shell functionality module.
 * Handle shell commands.
 * @module
 */

// Other modules
const exec = require("child_process").exec;
const log = require("debug")("lib:shell");

/**
 * This function tells the (Raspberry Pi) server to reboot.
 * @param {object} io - The Sockets.io object reference to emit to clients.
 * @returns {undefined}
 */
const reboot = (io) => {
    log("Reboot requested...");
    exec("/usr/bin/sudo systemctl reboot", function (err, stdout, stderr) {
        if (err) {
            log("Error", err);
        }
        else {
            io.emit("server-reboot", "Rebooting...");
        }
    });
}

/**
 * This function tells the (Raspberry Pi) server to shutdown.
 * Note: The Raspberry Pi does not shut down the hardware, just the OS.
 * @param {object} io - The Sockets.io object reference to emit to clients.
 * @returns {undefined}
 */
const shutdown = (io) => {
    log("Shutdown requested...");
    exec("/usr/bin/sudo systemctl poweroff", function (err, stdout, stderr) {
        if (err) {
            log("Error", err);
        }
        else {
            io.emit("server-shutdown", "Shutting down...");
        }
    });
}

/**
 * This function tells the (Raspberry Pi) server to do an update (Git Pull).
 * @param {object} io - The Sockets.io object reference to emit to clients.
 * @returns {undefined}
 */
const update = (io) => {
    log("Update requested..."); 
    // io.emit("server-update", __dirname);
    io.emit("server-update", "Updating...")
    // exec("cd ../../ && pwd", function (err, stdout, stderr) {
    //     io.emit("server-update", stdout);
    // });
    // git.stdout.on("data", data => {
    //     log(`Git replied: ${data}`);
    //     io.emit("server-update", data);
    //  });
    exec("git -C " + __dirname + " pull && npm install", function (err, stdout, stderr) {
        if (err) {
            log("Error", err);
            io.emit("server-update", err);
        }
        else {
            log("Update completed", stdout);
            io.emit("server-update", { "Updated" : stdout });
        }
    });
}

module.exports = {
    reboot,
    shutdown,
    update
}