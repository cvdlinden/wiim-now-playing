// ===========================================================================
// sockets.test.js 
//
// Unit tests for the sockets.js module.
// Uses Jest as the testing framework.
// ===========================================================================

const sockets = require('../lib/sockets.js');
const lib = require('../lib/lib.js');

jest.mock('../lib/lib.js');

describe('sockets.js', () => {
    let io;

    beforeEach(() => {
        io = { emit: jest.fn() };
        jest.clearAllMocks();
    });

    describe('getDevices', () => {
        it('should emit cleaned device list', () => {
            const deviceList = [
                {
                    friendlyName: 'Device1',
                    manufacturer: 'Manu1',
                    modelName: 'Model1',
                    location: 'http://ip1',
                    actions: { Play: true }
                },
                {
                    friendlyName: 'Device2',
                    manufacturer: 'Manu2',
                    modelName: 'Model2',
                    location: 'http://ip2',
                    actions: { Pause: true }
                }
            ];
            sockets.getDevices(io, deviceList);
            expect(io.emit).toHaveBeenCalledWith('devices-get', [
                {
                    friendlyName: 'Device1',
                    manufacturer: 'Manu1',
                    modelName: 'Model1',
                    location: 'http://ip1'
                },
                {
                    friendlyName: 'Device2',
                    manufacturer: 'Manu2',
                    modelName: 'Model2',
                    location: 'http://ip2'
                }
            ]);
        });
    });

    describe('setDevice', () => {
        it('should set selected device and emit device-set', () => {
            const deviceList = [
                {
                    friendlyName: 'Device1',
                    manufacturer: 'Manu1',
                    modelName: 'Model1',
                    location: 'http://ip1',
                    actions: { Play: true, Pause: true }
                }
            ];
            const deviceInfo = {};
            const serverSettings = { selectedDevice: {} };
            sockets.setDevice(io, deviceList, deviceInfo, serverSettings, 'http://ip1');
            expect(serverSettings.selectedDevice).toEqual({
                friendlyName: 'Device1',
                manufacturer: 'Manu1',
                modelName: 'Model1',
                location: 'http://ip1',
                actions: ['Play', 'Pause']
            });
            expect(io.emit).toHaveBeenCalledWith('device-set', serverSettings.selectedDevice);
            expect(lib.saveSettings).toHaveBeenCalledWith(serverSettings);
        });

        it('should not emit if device not found', () => {
            const deviceList = [
                { location: 'http://ip1' }
            ];
            const deviceInfo = {};
            const serverSettings = { selectedDevice: {} };
            sockets.setDevice(io, deviceList, deviceInfo, serverSettings, 'http://ip2');
            expect(io.emit).not.toHaveBeenCalledWith('device-set', expect.anything());
        });
    });

    describe('scanDevices', () => {
        it('should call ssdp.scan and emit devices-refresh', () => {
            const ssdp = { scan: jest.fn() };
            const deviceList = [];
            const serverSettings = {};
            sockets.scanDevices(io, ssdp, deviceList, serverSettings);
            expect(ssdp.scan).toHaveBeenCalledWith(deviceList, serverSettings);
            expect(io.emit).toHaveBeenCalledWith('devices-refresh', 'Scanning for devices...');
        });
    });

    describe('getServerSettings', () => {
        it('should emit server-settings', () => {
            const serverSettings = { foo: 'bar' };
            sockets.getServerSettings(io, serverSettings);
            expect(io.emit).toHaveBeenCalledWith('server-settings', serverSettings);
        });
    });
});