// Custom functionality module
// ===========================================================================
// Contains generic functions to aid the server app

// Other modules
const log = require("debug")("lib:lib");

// Exports
module.exports = {

    getResult: (req) => { // Sample
        log("getResult", req)
        return req + " OK";
    },

    getDate: () => { // Sample
        log("getDate")
        var date = new Date();
        return date.toUTCString();
    },

    /* ====================================================================
    *  Cookies
    *  requires the Express cookie-parser middleware
    */

    // Gets the cookie name-value pair from the http request
    getCookieVal: (req, name) => {
        if (req.cookies && typeof req.cookies[name] === "undefined") {
            log("getCookieVal", name, null)
            return null;
        }
        else {
            log("getCookieVal", name, req.cookies[name]);
            return req.cookies[name];
        }
    },

    // Sets a cookie name-value pair on the http response
    setCookieVal: (res, name, val) => {
        log("setCookieVal", name, val)
        res.cookie(name, val)
    },

    // Clears all cookies
    clearCookies: (req, res, cookies) => {
        log("clearCookies", cookies);
        Object.keys(req.cookies).forEach((name) => {
            log("clearCookies", name);
            res.clearCookie(name);
        });
        // res.status(200);
    }

};
