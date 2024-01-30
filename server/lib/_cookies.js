// ===========================================================================
// cookies.js
//
// Cookie specific functionality module.
// Contains functions to handle cookies. 

// Requires the Express cookie-parser middleware in index.js
// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

// Other modules
const log = require("debug")("lib:cookies");

module.exports = {

    // Gets the cookie name-value pair from the http request
    get: (req, name) => {
        if ((req.cookies && typeof req.cookies[name] === "undefined") || req.cookies[name] === "") {
            log("get", name, null)
            return null;
        }
        else {
            log("get", name, req.cookies[name]);
            return req.cookies[name];
        }
    },

    // Sets a cookie name-value pair on the http response
    set: (res, cookies, name, val) => {
        log("set", name, val)
        res.cookie(name, val)
        cookies[name] = val;
    },

    // Clear a cookie name-value pair on the http response
    clear: (res, cookies, name) => {
        log("clear", name);
        res.clearCookie(name);
        // cookies[name] = null;
        delete cookies[name];
    },

    // Get all cookies
    getAll: (req) => {
        log("getAll", req.cookies);
        if (Object.keys(req.cookies).length === 0) {
            log("No cookies found");
            return {};
        }
        else {
            log("Returning all found cookies");
            var tempCookies = req.cookies;
            Object.keys(tempCookies).forEach((name) => {
                if (tempCookies[name] === "") {
                    tempCookies[name] = null;
                };
            });
            return tempCookies;
        };
    },

    // Clears all cookies
    clearAll: (res, cookies) => {
        log("clearAll", cookies);
        Object.keys(cookies).forEach((name) => {
            module.exports.clear(res, cookies, name);
            // log("clear", name);
            // res.clearCookie(name);
            // cookies[name] = null;
        });
        // res.status(200);
    }

};
