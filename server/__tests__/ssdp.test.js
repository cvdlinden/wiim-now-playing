// ===========================================================================
// ssdp.test.js
//
// Unit tests for the ssdp.js module.
// Uses Jest as the testing framework.
// ===========================================================================

jest.mock('node-ssdp', () => ({
    Client: jest.fn()
}));
jest.mock('../lib/upnpClient.js');
jest.mock('debug', () => () => jest.fn());

const { Client: SSDPClient } = require('node-ssdp');
const upnp = require('../lib/upnpClient.js');
const ssdp = require('../lib/ssdp.js');

describe('ssdp.js', () => {
    let deviceList, serverSettings;
    let mockClientInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        deviceList = [];
        serverSettings = { selectedDevice: {} };
        mockClientInstance = {
            on: jest.fn(),
            search: jest.fn()
        };
        SSDPClient.mockImplementation(() => mockClientInstance);
    });

    describe('scan', () => {
        it('should create an SSDP client and start AVTransport search', () => {
            ssdp.scan(deviceList, serverSettings);

            expect(SSDPClient).toHaveBeenCalledWith({ explicitSocketBind: true });
            expect(mockClientInstance.on).toHaveBeenCalledWith('response', expect.any(Function));
            expect(mockClientInstance.search).toHaveBeenCalledWith(
                'urn:schemas-upnp-org:service:AVTransport:1'
            );
        });

        it('should reset the device list before scanning', () => {
            deviceList.push({ location: 'http://existing:1234/desc.xml' });
            expect(deviceList).toHaveLength(1);

            ssdp.scan(deviceList, serverSettings);

            expect(deviceList).toHaveLength(0);
        });

        it('should call getDeviceDescription when a new device responds', () => {
            ssdp.scan(deviceList, serverSettings);

            const responseCallback = mockClientInstance.on.mock.calls.find(
                call => call[0] === 'response'
            )[1];

            const respSSDP = { LOCATION: 'http://192.168.1.50:49152/desc.xml' };
            responseCallback(respSSDP, 200, {});

            expect(upnp.getDeviceDescription).toHaveBeenCalledWith(
                deviceList,
                serverSettings,
                respSSDP
            );
        });

        it('should not call getDeviceDescription for a duplicate device location', () => {
            ssdp.scan(deviceList, serverSettings);

            const responseCallback = mockClientInstance.on.mock.calls.find(
                call => call[0] === 'response'
            )[1];

            // Simulate the device already being present in the list
            const location = 'http://192.168.1.50:49152/desc.xml';
            deviceList.push({ location });

            const respSSDP = { LOCATION: location };
            responseCallback(respSSDP, 200, {});

            expect(upnp.getDeviceDescription).not.toHaveBeenCalled();
        });

        it('should call getDeviceDescription for each distinct device that responds', () => {
            ssdp.scan(deviceList, serverSettings);

            const responseCallback = mockClientInstance.on.mock.calls.find(
                call => call[0] === 'response'
            )[1];

            const resp1 = { LOCATION: 'http://192.168.1.10:49152/desc.xml' };
            const resp2 = { LOCATION: 'http://192.168.1.20:49152/desc.xml' };
            responseCallback(resp1, 200, {});
            responseCallback(resp2, 200, {});

            expect(upnp.getDeviceDescription).toHaveBeenCalledTimes(2);
            expect(upnp.getDeviceDescription).toHaveBeenCalledWith(deviceList, serverSettings, resp1);
            expect(upnp.getDeviceDescription).toHaveBeenCalledWith(deviceList, serverSettings, resp2);
        });
    });
});
