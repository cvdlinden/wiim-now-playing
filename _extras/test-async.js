// app.js

const asyncMod = require('./test-async-module.js');
const UPnP = require("upnp-device-client");

console.log("START");

// Example usage: Fetch data from a sample API
const apiUrl = 'http://jsonplaceholder.typicode.com/posts/1'; // Replace with your desired API URL

// Using async anon function
// (async () => {
//     try {
//         const result = await asyncMod.fetchDataFromApi(apiUrl);
//         console.log('Received data:', result);
//         // Handle the data (e.g., process, display, or save it)
//     } catch (error) {
//         console.error('Error fetching data:', error.message);
//     }
// })();

// Promise method. Using .then and .catch
console.log("async fetchDataFromApi")
asyncMod.fetchDataFromApi(apiUrl)
    .then((result) => {
        // Handle the result here
        console.log("fetchDataFromApi RESULT", typeof result);
        console.log("fetchDataFromApi KEYS:");
        const aData = asyncMod.formatData(result);
        aData.forEach(d => {
            console.log("-", d);
        });
    })
    .catch((error) => {
        console.error('Error fetching data:', error.message);
    });

// UPnP client, using a callback function
console.log("UPnP client")
handleDevDesc = (err, desc) => {
    if (err) {
        console.log("client Error:", err);
    }
    else {
        console.log("client RESULT", typeof desc);
        console.log("client KEYS:");
        const aData = asyncMod.formatData(desc);
        aData.forEach(d => {
            console.log("-", d);
        });
    }
}
let client = new UPnP('http://192.168.1.243:49152/description.xml');
// client.getDeviceDescription((err, description) => { handleDevDesc(err, description) })
client.getDeviceDescription(handleDevDesc)


console.log("END");
