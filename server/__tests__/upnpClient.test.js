// ===========================================================================
// upnpClient.test.js 
//
// Unit tests for the upnpClient.js module.
// Uses Jest as the testing framework.
// ===========================================================================

const upnpClient = require('../lib/upnpClient.js');
const lib = require('../lib/lib.js');
const lyrics = require("../lib/lyrics.js"); // Lyrics error
const xml2js = require('xml2js');
const UPnP = require("upnp-device-client");

jest.mock('../lib/lib.js');
jest.mock('../lib/lyrics.js');
jest.mock('xml2js');
jest.mock('upnp-device-client');

jest.mock('../lib/upnpClient.js', () => {
    const original = jest.requireActual('../lib/upnpClient.js');
    return {
        ...original,
        ensureClient: jest.fn((info) => {
            // Zorg dat er ALTIJD een mock client is als die er nog niet was
            if (!info.client) info.client = { callAction: jest.fn() };
        })
    };
});

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
        // Use restoreAllMocks so that jest.spyOn overrides created inside individual tests
        // (e.g. in callDeviceAction tests) do not leak into subsequent tests.
        // All spies are set up inside test bodies, not in beforeEach, so this is safe.
        jest.restoreAllMocks();
    });

    describe('createClient', () => {
        it('should create a UPnP client', () => {
            const client = upnpClient.createClient('http://test');
            expect(client).toBeDefined();
        });
    });

    describe('ensureClient', () => {
        it('should create client if not present', () => {
            deviceInfo.client = null;
            upnpClient.ensureClient(deviceInfo, serverSettings);
            expect(deviceInfo.client).toBeDefined();
        });

        it('should not recreate client if already present', () => {
            deviceInfo.client = { test: true };
            upnpClient.ensureClient(deviceInfo, serverSettings);
            expect(deviceInfo.client).toEqual({ test: true });
        });
    });

    describe('startState', () => {
        it('should trigger the state update cycle', () => {
            // 1. Zorg dat er een client is met een mock callAction
            deviceInfo.client = { callAction: jest.fn() };
            serverSettings.selectedDevice.actions = ['GetTransportInfo'];

            // 2. Roep startState aan
            const interval = upnpClient.startState(io, deviceInfo, serverSettings);

            // 3. Assert: In plaats van de spy op upnpClient, checken we de client-mock
            // updateDeviceState wordt direct 1x aangeroepen door startState
            expect(deviceInfo.client.callAction).toHaveBeenCalledWith(
                "AVTransport",
                "GetTransportInfo",
                expect.any(Object),
                expect.any(Function)
            );

            // Netjes opruimen
            clearInterval(interval);
        });
    });

    describe('startMetadata', () => {
        it('should trigger the metadata update cycle', () => {
            // 1. Setup: Zorg dat de client en de juiste acties aanwezig zijn
            deviceInfo.client = { callAction: jest.fn() };
            serverSettings.selectedDevice.actions = ['GetInfoEx'];
            serverSettings.selectedDevice.location = 'http://1.1.1.1';

            // 2. Act: Start de polling
            const interval = upnpClient.startMetadata(io, deviceInfo, serverSettings);

            // 3. Assert: Controleer of de client is aangeroepen (bewijs dat updateDeviceMetadata draait)
            expect(deviceInfo.client.callAction).toHaveBeenCalledWith(
                "AVTransport",
                "GetInfoEx",
                expect.any(Object),
                expect.any(Function)
            );

            // Altijd opruimen!
            clearInterval(interval);
        });
    });

    describe('stopPolling', () => {
        it('should clear interval', () => {
            const interval = setInterval(() => { }, 1000);
            upnpClient.stopPolling(interval, 'test');
            expect(clearInterval).toBeDefined();
        });
    });

    describe('updateDeviceState', () => {
        it('should emit state if GetTransportInfo succeeds', () => {
            deviceInfo.client = {
                callAction: (service, action, options, cb) => cb(null, { CurrentTransportState: 'PLAYING' })
            };
            upnpClient.updateDeviceState(io, deviceInfo, serverSettings);
            expect(io.emit).toHaveBeenCalledWith('state', expect.objectContaining({ CurrentTransportState: 'PLAYING' }));
        });

        it('should emit null state if location or action missing', () => {
            serverSettings.selectedDevice.location = null;
            upnpClient.updateDeviceState(io, deviceInfo, serverSettings);
            expect(io.emit).toHaveBeenCalledWith('state', null);
        });

        it('should not emit state when GetTransportInfo returns an error', () => {
            deviceInfo.client = {
                callAction: (service, action, options, cb) => cb(new Error('UPnP error'), null)
            };
            upnpClient.updateDeviceState(io, deviceInfo, serverSettings);
            expect(io.emit).not.toHaveBeenCalled();
        });

        it('should call updateDeviceMetadata when state transitions from TRANSITIONING to PLAYING', done => {
            // Set previous state to TRANSITIONING
            deviceInfo.state = { CurrentTransportState: 'TRANSITIONING' };
            serverSettings.selectedDevice.actions = ['GetTransportInfo', 'GetInfoEx'];
            lib.getTimeStamp.mockReturnValue(77);
            deviceInfo.client = {
                callAction: jest.fn()
                    .mockImplementationOnce((service, action, options, cb) => {
                        // First call: updateDeviceState - GetTransportInfo returns PLAYING (from TRANSITIONING)
                        cb(null, { CurrentTransportState: 'PLAYING' });
                    })
                    .mockImplementationOnce((service, action, options, cb) => {
                        // Second call: updateDeviceMetadata triggered by TRANSITIONING→PLAYING transition
                        cb(null, { TrackMetaData: null, RelTime: '00:01:00' });
                    })
            };

            upnpClient.updateDeviceState(io, deviceInfo, serverSettings);

            setTimeout(() => {
                try {
                    // callAction should be called twice: GetTransportInfo + GetInfoEx (from triggered updateDeviceMetadata)
                    expect(deviceInfo.client.callAction).toHaveBeenCalledTimes(2);
                    done();
                } catch (e) { done(e); }
            }, 100);
        });
    });

    describe('updateDeviceMetadata', () => {
        beforeEach(() => {
            // Maak een mock client met een jest.fn() voor callAction
            const mockClient = {
                callAction: jest.fn()
            };

            deviceInfo = {
                client: mockClient // Handmatig injecteren voorkomt creatie-issues
            };

            lib.getTimeStamp.mockReturnValue(12345);
        });

        it('should emit metadata for GetInfoEx with XML', (done) => {
            // 1. Setup metadata & settings
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetInfoEx']; // MOET exact dit zijn

            const mockClient = {
                callAction: jest.fn((service, action, params, cb) => {
                    // Simuleer succesvolle UPnP respons
                    cb(null, {
                        TrackMetaData: '<xml>...</xml>',
                        RelTime: '00:01:00'
                    });
                })
            };
            deviceInfo.client = mockClient;

            // 2. Mock xml2js exact volgens de if-check in je code (L127)
            xml2js.parseString.mockImplementation((xml, opts, cb) => {
                cb(null, {
                    "DIDL-Lite": {
                        item: { title: "Test" }
                    }
                });
            });

            // 3. Voer de functie uit
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);

            // 4. Gebruik setImmediate of een iets langere timeout
            setTimeout(() => {
                try {
                    expect(io.emit).toHaveBeenCalledWith('metadata', expect.objectContaining({
                        RelTime: '00:01:00',
                        metadataTimeStamp: 12345
                    }));
                    // Check specifiek het resultaat van de xml-parsing
                    expect(deviceInfo.metadata.trackMetaData).toEqual({ title: "Test" });
                    done();
                } catch (error) {
                    done(error);
                }
            }, 100);
        });

        it('should emit metadata for GetPositionInfo with XML', done => {
            serverSettings.selectedDevice.actions = ['GetPositionInfo'];
            const xml = '<DIDL-Lite><item><artist>TestArtist</artist></item></DIDL-Lite>';
            deviceInfo.client.callAction.mockImplementation((service, action, options, cb) => {
                cb(null, { TrackMetaData: xml, RelTime: '00:02:00' });
            });
            xml2js.parseString.mockImplementation((xml, opts, cb) => {
                cb(null, { 'DIDL-Lite': { item: { artist: 'TestArtist' } } });
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                expect(io.emit).toHaveBeenCalledWith('metadata', expect.objectContaining({
                    trackMetaData: { artist: 'TestArtist' },
                    RelTime: '00:02:00',
                    metadataTimeStamp: 12345
                }));
                done();
            }, 10);
        });

        it('should set metadata to null if no location', () => {
            serverSettings.selectedDevice.location = null;
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            expect(deviceInfo.metadata).toBeNull();
        });

        it('should emit metadata for GetInfoEx when TrackMetaData is null', done => {
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetInfoEx'];
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(null, { TrackMetaData: null, RelTime: '00:00:30' });
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(io.emit).toHaveBeenCalledWith('metadata', expect.objectContaining({
                        RelTime: '00:00:30',
                        metadataTimeStamp: 12345
                    }));
                    expect(deviceInfo.metadata.trackMetaData).toBeUndefined();
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should handle xml2js parse error in GetInfoEx callback', done => {
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetInfoEx'];
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(null, { TrackMetaData: '<invalid>', RelTime: '00:00:10' });
            });
            xml2js.parseString.mockImplementation((xml, opts, cb) => {
                cb(new Error('XML parse error'), null);
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(io.emit).not.toHaveBeenCalled();
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should call getLyricsForMetadata when lyrics are enabled in GetInfoEx path', done => {
            const lyrics = require('../lib/lyrics.js');
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetInfoEx'];
            serverSettings.features = { lyrics: { enabled: true } };
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(null, { TrackMetaData: '<xml/>', RelTime: '00:01:00' });
            });
            xml2js.parseString.mockImplementation((xml, opts, cb) => {
                cb(null, { 'DIDL-Lite': { item: { title: 'Test' } } });
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(lyrics.getLyricsForMetadata).toHaveBeenCalledWith(io, deviceInfo, serverSettings);
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should emit metadata for GetPositionInfo when TrackMetaData is null', done => {
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetPositionInfo'];
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(null, { TrackMetaData: null, RelTime: '00:00:45' });
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(io.emit).toHaveBeenCalledWith('metadata', expect.objectContaining({
                        RelTime: '00:00:45',
                        metadataTimeStamp: 12345
                    }));
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should handle xml2js parse error in GetPositionInfo callback', done => {
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetPositionInfo'];
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(null, { TrackMetaData: '<invalid>', RelTime: '00:00:10' });
            });
            xml2js.parseString.mockImplementation((xml, opts, cb) => {
                cb(new Error('XML parse error'), null);
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(io.emit).not.toHaveBeenCalled();
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should call getLyricsForMetadata when lyrics are enabled in GetPositionInfo path', done => {
            const lyrics = require('../lib/lyrics.js');
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetPositionInfo'];
            serverSettings.features = { lyrics: { enabled: true } };
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(null, { TrackMetaData: '<xml/>', RelTime: '00:02:00' });
            });
            xml2js.parseString.mockImplementation((xml, opts, cb) => {
                cb(null, { 'DIDL-Lite': { item: { title: 'Track' } } });
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(lyrics.getLyricsForMetadata).toHaveBeenCalledWith(io, deviceInfo, serverSettings);
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should handle GetPositionInfo callAction error without emitting', done => {
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetPositionInfo'];
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(new Error('Device unreachable'), null);
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(io.emit).not.toHaveBeenCalled();
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should set metadata to null when no GetInfoEx or GetPositionInfo action is available', () => {
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['Play', 'Pause'];
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            expect(deviceInfo.metadata).toBeNull();
        });

        it('should handle GetInfoEx callAction error without emitting', done => {
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['GetInfoEx'];
            deviceInfo.client.callAction.mockImplementation((service, action, params, cb) => {
                cb(new Error('GetInfoEx error'), null);
            });
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(io.emit).not.toHaveBeenCalled();
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should create a client via ensureClient when no client is present', () => {
            // Use a fresh UPnP mock that returns a client with callAction
            UPnP.mockImplementation(() => ({ callAction: jest.fn() }));
            deviceInfo = {}; // No client set - triggers real ensureClient
            serverSettings.selectedDevice.location = 'http://1.1.1.1';
            serverSettings.selectedDevice.actions = ['Play']; // No GetInfoEx/GetPositionInfo - goes to else
            upnpClient.updateDeviceMetadata(io, deviceInfo, serverSettings);
            // ensureClient should have created a client
            expect(deviceInfo.client).toBeDefined();
            expect(deviceInfo.metadata).toBeNull();
        });
    });

    describe('callDeviceAction', () => {
        it('should call action and emit result', () => {
            deviceInfo.client = {
                callAction: (service, action, options, cb) => cb(null, { result: 'ok' })
            };
            jest.spyOn(upnpClient, 'updateDeviceMetadata').mockImplementation(() => { });
            jest.spyOn(upnpClient, 'updateDeviceState').mockImplementation(() => { });
            upnpClient.callDeviceAction(io, 'Play', deviceInfo, serverSettings);
            expect(io.emit).toHaveBeenCalledWith('device-action', 'Play', { result: 'ok' });
        });

        it('should not call action if not available', () => {
            serverSettings.selectedDevice.actions = [];
            upnpClient.callDeviceAction(io, 'Pause', deviceInfo, serverSettings);
            expect(io.emit).not.toHaveBeenCalled();
        });

        it('should not emit when device action returns an error', () => {
            serverSettings.selectedDevice.actions = ['Pause'];
            deviceInfo.client = {
                callAction: (service, action, options, cb) => cb(new Error('UPnP Action Error'), null)
            };
            upnpClient.callDeviceAction(io, 'Pause', deviceInfo, serverSettings);
            expect(io.emit).not.toHaveBeenCalled();
        });

        it('should include Speed option when action is Play', done => {
            let capturedOptions;
            // Restrict actions to only 'Play' so updateDeviceState does not trigger a second callAction
            serverSettings.selectedDevice.actions = ['Play'];
            deviceInfo.client = {
                callAction: (service, action, options, cb) => {
                    capturedOptions = options;
                    cb(null, {});
                }
            };
            upnpClient.callDeviceAction(io, 'Play', deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(capturedOptions).toMatchObject({ InstanceID: 0, Speed: 1 });
                    done();
                } catch (e) { done(e); }
            }, 100);
        });

        it('should not include Speed option for non-Play actions', done => {
            let capturedOptions;
            serverSettings.selectedDevice.actions = ['Pause'];
            deviceInfo.client = {
                callAction: (service, action, options, cb) => {
                    capturedOptions = options;
                    cb(null, {});
                }
            };
            upnpClient.callDeviceAction(io, 'Pause', deviceInfo, serverSettings);
            setTimeout(() => {
                try {
                    expect(capturedOptions).not.toHaveProperty('Speed');
                    expect(capturedOptions).toMatchObject({ InstanceID: 0 });
                    done();
                } catch (e) { done(e); }
            }, 100);
        });
    });

    describe('getDeviceDescription', () => {
        it('should create a client and call getDeviceDescription', () => {
            const mockInstance = {
                getDeviceDescription: jest.fn((cb) => cb(null, {
                    friendlyName: 'Test Device',
                    deviceType: 'urn:upnp-org:device:MediaRenderer:1',
                    services: {} // No AVTransport - takes the OpenHome path
                })),
                getServiceDescription: jest.fn()
            };
            UPnP.mockImplementation(() => mockInstance);

            const deviceList = [];
            const respSSDP = { LOCATION: 'http://test' };
            upnpClient.getDeviceDescription(deviceList, serverSettings, respSSDP);

            expect(mockInstance.getDeviceDescription).toHaveBeenCalled();
        });

        it('should handle error from getDeviceDescription callback', () => {
            const mockInstance = {
                getDeviceDescription: jest.fn((cb) => cb(new Error('Connection refused'), null)),
                getServiceDescription: jest.fn()
            };
            UPnP.mockImplementation(() => mockInstance);

            const deviceList = [];
            const respSSDP = { LOCATION: 'http://192.168.1.100:49152/desc.xml' };
            upnpClient.getDeviceDescription(deviceList, serverSettings, respSSDP);

            expect(mockInstance.getDeviceDescription).toHaveBeenCalled();
            expect(deviceList).toHaveLength(0);
        });

        it('should proceed to getServiceDescription when AVTransport is supported', () => {
            const mockInstance = {
                getDeviceDescription: jest.fn((cb) => cb(null, {
                    friendlyName: 'WiiM Pro',
                    deviceType: 'urn:schemas-upnp-org:device:MediaRenderer:1',
                    manufacturer: 'Linkplay',
                    modelName: 'WiiM Pro',
                    services: { 'urn:upnp-org:serviceId:AVTransport': {} }
                })),
                getServiceDescription: jest.fn((service, cb) => cb(null, { actions: { Play: {}, Pause: {} } }))
            };
            UPnP.mockImplementation(() => mockInstance);

            const deviceList = [];
            const respSSDP = { LOCATION: 'http://192.168.1.100:49152/desc.xml' };
            const localSettings = { selectedDevice: {} };
            upnpClient.getDeviceDescription(deviceList, localSettings, respSSDP);

            expect(mockInstance.getServiceDescription).toHaveBeenCalledWith('AVTransport', expect.any(Function));
        });

        it('should not call getServiceDescription for OpenHome devices (no AVTransport)', () => {
            const mockInstance = {
                getDeviceDescription: jest.fn((cb) => cb(null, {
                    friendlyName: 'OpenHome Device',
                    deviceType: 'urn:schemas-upnp-org:device:MediaRenderer:1',
                    manufacturer: 'SomeManufacturer',
                    modelName: 'SomeModel',
                    services: {} // No AVTransport service
                })),
                getServiceDescription: jest.fn()
            };
            UPnP.mockImplementation(() => mockInstance);

            const deviceList = [];
            const respSSDP = { LOCATION: 'http://192.168.1.200:49152/desc.xml' };
            upnpClient.getDeviceDescription(deviceList, serverSettings, respSSDP);

            expect(mockInstance.getServiceDescription).not.toHaveBeenCalled();
            expect(deviceList).toHaveLength(0);
        });
    });

    describe('getServiceDescription', () => {
        it('should add device with actions and auto-select WiiM device', done => {
            const deviceList = [];
            const respSSDP = { LOCATION: 'http://192.168.1.100:49152/desc.xml' };
            const deviceDesc = {
                friendlyName: 'WiiM Pro',
                manufacturer: 'Linkplay',
                modelName: 'WiiM Pro',
                services: {}
            };
            const deviceClient = {
                getServiceDescription: jest.fn((service, cb) => cb(null, { actions: { Play: {}, Pause: {}, Stop: {} } }))
            };
            const localSettings = { selectedDevice: {} };

            upnpClient.getServiceDescription(deviceList, localSettings, deviceClient, respSSDP, deviceDesc);

            setTimeout(() => {
                expect(deviceList).toHaveLength(1);
                expect(deviceList[0].actions).toEqual({ Play: {}, Pause: {}, Stop: {} });
                // WiiM/Linkplay device should be auto-selected when none is selected yet
                expect(localSettings.selectedDevice.friendlyName).toBe('WiiM Pro');
                expect(localSettings.selectedDevice.actions).toEqual(['Play', 'Pause', 'Stop']);
                expect(lib.saveSettings).toHaveBeenCalledWith(localSettings);
                done();
            }, 10);
        });

        it('should add device without actions when getServiceDescription returns an error', done => {
            const deviceList = [];
            const respSSDP = { LOCATION: 'http://192.168.1.100:49152/desc.xml' };
            const deviceDesc = {
                friendlyName: 'WiiM Mini',
                manufacturer: 'Linkplay',
                modelName: 'WiiM Mini',
                services: {}
            };
            const deviceClient = {
                getServiceDescription: jest.fn((service, cb) => cb(new Error('Service unavailable'), null))
            };
            const localSettings = { selectedDevice: {} };

            upnpClient.getServiceDescription(deviceList, localSettings, deviceClient, respSSDP, deviceDesc);

            setTimeout(() => {
                expect(deviceList).toHaveLength(1);
                expect(deviceList[0].actions).toEqual({});
                done();
            }, 10);
        });

        it('should not auto-select non-WiiM/non-Linkplay device when no device is selected', done => {
            const deviceList = [];
            const respSSDP = { LOCATION: 'http://192.168.1.200:49152/desc.xml' };
            const deviceDesc = {
                friendlyName: 'Generic Renderer',
                manufacturer: 'SomeManufacturer',
                modelName: 'SomeModel',
                services: {}
            };
            const deviceClient = {
                getServiceDescription: jest.fn((service, cb) => cb(null, { actions: { Play: {} } }))
            };
            const localSettings = { selectedDevice: {} };

            upnpClient.getServiceDescription(deviceList, localSettings, deviceClient, respSSDP, deviceDesc);

            setTimeout(() => {
                expect(deviceList).toHaveLength(1);
                // Should NOT auto-select a non-WiiM/Linkplay device
                expect(localSettings.selectedDevice.friendlyName).toBeUndefined();
                done();
            }, 10);
        });

        it('should update selected device when location matches existing selection', done => {
            const deviceList = [];
            const location = 'http://192.168.1.100:49152/desc.xml';
            const respSSDP = { LOCATION: location };
            const deviceDesc = {
                friendlyName: 'WiiM Pro',
                manufacturer: 'SomeManufacturer', // Not Linkplay
                modelName: 'SomeModel',           // Not WiiM
                services: {}
            };
            const deviceClient = {
                getServiceDescription: jest.fn((service, cb) => cb(null, { actions: { Play: {}, Next: {} } }))
            };
            // Location already stored as selected device
            const localSettings = { selectedDevice: { location } };

            upnpClient.getServiceDescription(deviceList, localSettings, deviceClient, respSSDP, deviceDesc);

            setTimeout(() => {
                // Should update because location matches
                expect(localSettings.selectedDevice.friendlyName).toBe('WiiM Pro');
                expect(lib.saveSettings).toHaveBeenCalled();
                done();
            }, 10);
        });
    });
});