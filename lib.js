// Library for the server module
module.exports = {

    getResult: (req) => {
        return req + " OK";
    },

    getDate: () => {
        var date = new Date();
        return date.toUTCString();
    }

};
