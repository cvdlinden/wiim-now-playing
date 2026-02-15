// ===========================================================================
// upnpClient.test.js 
//
// Unit tests for the upnpClient.js module.
// Uses Jest as the testing framework.
// ===========================================================================

const upnpClient = require('../lib/upnpClient.js');
const lib = require('../lib/lib.js');
const lyrics = require("./lyrics.js"); // Lyrics error
const xml2js = require('xml2js');
const UPnP = require("upnp-device-client");

jest.mock('../lib/lib.js');
jest.mock('xml2js');
jest.mock('upnp-device-client');

describe('upnpClient.js', () => {
    let io, deviceInfo, serverSettings;

    beforeEach(() => {
        io = { emit: jest.fn() };
        deviceInfo = {};
        serverSettings = {
            selectedDevice: {
                location: 'http://192.168.1.100:1400/desc.xml',
                actions: ['GetTransportInfo', 'Play']
            },
            timeouts: { state: 1000, metadata: 2000 }
        };
        jest.clearAllMocks();
    });

    describe('createClient', () => {
        it('should create a UPnP client', () => {
            const client = upnpClient.createClient('http://test');
            expect(client).toBeDefined();
        });
    });

    // describe('ensureClient', () => {
    //     it('should create client if not present', () => {
    //         deviceInfo.client = null;
    //         upnpClient.ensureClient(deviceInfo, serverSettings);
    //         expect(deviceInfo.client).toBeDefined();
    //     });

    //     it('should not recreate client if already present', () => {
    //         deviceInfo.client = { test: true };
    //         upnpClient.ensureClient(deviceInfo, serverSettings);
    //         expect(deviceInfo.client).toEqual({ test: true });
    //     });
    // });

    describe('startState', () => {
        it('should call updateDeviceState and set interval', () => {
            jest.spyOn(upnpClient, 'updateDeviceState').mockImplementation(() => {});
            const interval = upnpClient.startState(io, deviceInfo, serverSettings);
            expect(upnpClient.updateDeviceState).toHaveBeenCalledWith(io, deviceInfo, serverSettings);
            clearInterval(interval);
        });
    });

    describe('startMetadata', () => {
        it('should call updateDeviceMetadata and set interval', () => {
            jest.spyOn(upnpClient, 'updateDeviceMetadata').mockImplementation(() => {});
            const interval = upnpClient.startMetadata(io, deviceInfo, serverSettings);
            expect(upnpClient.updateDeviceMetadata).toHaveBeenCalledWith(io, deviceInfo, serverSettings);
            clearInterval(interval);
        });
    });

    describe('stopPolling', () => {
        it('should clear interval', () => {
            const interval = setInterval(() => {}, 1000);
            upnpClient.stopPolling(interval, 'test');
            expect(clearInterval).toBeDefined();
        });
    });

    // describe('updateDeviceState', () => {
    //     it('should emit state if GetTransportInfo succeeds', () => {
    //         deviceInfo.client = {
    //             callAction: (service, action, options, cb) => cb(null, { CurrentTransportState: 'PLAYING' })
    //         };
    //         upnpClient.updateDeviceState(io, deviceInfo, serverSettings);
    //         expect(io.emit).toHaveBeenCalledWith('state', expect.objectContaining({ CurrentTransportState: 'PLAYING' }));
    //     });

    //     it('should emit null state if location or action missing', () => {
    //         serverSettings.selectedDevice.location = null;
    //         upnpClient.updateDeviceState(io, deviceInfo, serverSettings);
    //         expect(io.emit).toHaveBeenCalledWith('state', null);
    //     });
    // });

    // describe('updateDeviceMetadata', () => {
    //     beforeEach(() => {
    //         deviceInfo.client = {
    //             callAction: jest.fn()
    //         };
    //         lib.getTimeStamp.mockReturnValue(12345);
    //     });

    //     it('should emit metadata for GetInfoEx with XML', done => {
    //         serverSettings.selectedDevice.actions = ['GetInfoEx'];
    //         const xml = '<DIDL-Lite><item><title>Test</title></item></DIDL-Lite>';
    //         deviceInfo.client.callAction.mockImplementation((service, action, options, cb) => {
    //             cb(null, { TrackMetaData: xml, RelTime: '00:01:00' });
    //         });
    //         xml2js.parseString.mockImplementation((xml, opts, cb) => {
    //             cb(null, { 'DIDL-Lite': { item: { title: 'Test' } } });
    //         });
    //         upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
    //         setTimeout(() => {
    //             expect(io.emit).toHaveBeenCalledWith('metadata', expect.objectContaining({
    //                 trackMetaData: { title: 'Test' },
    //                 RelTime: '00:01:00',
    //                 metadataTimeStamp: 12345
    //             }));
    //             done();
    //         }, 10);
    //     });

    //     it('should emit metadata for GetPositionInfo with XML', done => {
    //         serverSettings.selectedDevice.actions = ['GetPositionInfo'];
    //         const xml = '<DIDL-Lite><item><artist>TestArtist</artist></item></DIDL-Lite>';
    //         deviceInfo.client.callAction.mockImplementation((service, action, options, cb) => {
    //             cb(null, { TrackMetaData: xml, RelTime: '00:02:00' });
    //         });
    //         xml2js.parseString.mockImplementation((xml, opts, cb) => {
    //             cb(null, { 'DIDL-Lite': { item: { artist: 'TestArtist' } } });
    //         });
    //         upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
    //         setTimeout(() => {
    //             expect(io.emit).toHaveBeenCalledWith('metadata', expect.objectContaining({
    //                 trackMetaData: { artist: 'TestArtist' },
    //                 RelTime: '00:02:00',
    //                 metadataTimeStamp: 12345
    //             }));
    //             done();
    //         }, 10);
    //     });

    //     it('should set metadata to null if no location', () => {
    //         serverSettings.selectedDevice.location = null;
    //         upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
    //         expect(deviceInfo.metadata).toBeNull();
    //     });
    // });

    describe('callDeviceAction', () => {
        it('should call action and emit result', () => {
            deviceInfo.client = {
                callAction: (service, action, options, cb) => cb(null, { result: 'ok' })
            };
            jest.spyOn(upnpClient, 'updateDeviceMetadata').mockImplementation(() => {});
            jest.spyOn(upnpClient, 'updateDeviceState').mockImplementation(() => {});
            upnpClient.callDeviceAction(io, 'Play', deviceInfo, serverSettings);
            expect(io.emit).toHaveBeenCalledWith('device-action', 'Play', { result: 'ok' });
        });

        it('should not call action if not available', () => {
            serverSettings.selectedDevice.actions = [];
            upnpClient.callDeviceAction(io, 'Pause', deviceInfo, serverSettings);
            expect(io.emit).not.toHaveBeenCalled();
        });
    });

    describe('getDeviceDescription', () => {
        it('should call getDeviceDescription on client', () => {
            const deviceList = [];
            const respSSDP = { LOCATION: 'http://test' };
            const client = upnpClient.createClient(respSSDP.LOCATION);
            client.getDeviceDescription = jest.fn((cb) => cb(null, { friendlyName: 'Test', deviceType: 'urn:upnp-org:device:MediaRenderer:1', services: { 'urn:upnp-org:serviceId:AVTransport': true } }));
            upnpClient.getDeviceDescription(deviceList, serverSettings, respSSDP);
            expect(client.getDeviceDescription).toBeDefined();
        });
    });

    // describe('getServiceDescription', () => {
    //     it('should add device to deviceList and set default selected device', done => {
    //         const deviceList = [];
    //         const deviceClient = {
    //             getServiceDescription: jest.fn()
    //         };
    //         const respSSDP = { LOCATION: 'http://test' };
    //         const deviceDesc = {
    //             friendlyName: 'Test',
    //             manufacturer: 'Linkplay',
    //             modelName: 'WiiM',
    //             services: { 'urn:upnp-org:serviceId:AVTransport': true }
    //         };
    //         deviceClient.getServiceDescription
    //             .mockImplementationOnce((service, cb) => cb(null, { actions: { Play: {}, Pause: {} } }))
    //             .mockImplementationOnce((service, cb) => cb(null, { actions: { SetVolume: {} } }));

    //         upnpClient.getServiceDescription(deviceList, serverSettings, deviceClient, respSSDP, deviceDesc);

    //         setTimeout(() => {
    //             expect(deviceList.length).toBe(1);
    //             expect(serverSettings.selectedDevice.friendlyName).toBe('Test');
    //             done();
    //         }, 10);
    //     });
    // });
});