// ===========================================================================
// shell.js

/**
 * Shell functionality module.
 * Handle shell commands.
 * @module
 */

// Other modules
const exec = require("child_process").exec;
const execFile = require("child_process").execFile;
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
    io.emit("server-update", { "status": "updating" });
    execFile("git", ["-C", __dirname, "pull"], (err, gitStdout, gitStderr) => {
        if (err) {
            log("Git error", err);
            io.emit("server-update", { "status": "error", "git": err, "stderr": gitStderr });
        } else {
            execFile("npm", ["install"], { cwd: __dirname }, (npmErr, npmStdout, npmStderr) => {
                if (npmErr) {
                    log("npm install error", npmErr);
                    io.emit("server-update", { "status": "error", "git": gitStdout, "npm": npmErr, "stderr": npmStderr });
                } else {
                    log("Update completed", gitStdout + "\n" + npmStdout);
                    io.emit("server-update", { "status": "ok", "git": gitStdout, "npm": npmStdout });
                }
            });
        }
    });
}

module.exports = {
    reboot,
    shutdown,
    update
}