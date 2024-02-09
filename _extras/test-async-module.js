// test-async-module.js

const http = require('http');

fetchDataFromApi = async (url) => {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });
    });
}

formatData = (data) => {
    let aData = [];
    Object.keys(data).forEach((d) => {
        aData.push(d);
    })
    return aData;
}

module.exports = {
    fetchDataFromApi,
    formatData
};
