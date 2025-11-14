// ===========================================================================
// httpApi.test.js 
//
// Unit tests for the httpApi.js module.
// Uses Jest as the testing framework.
// ===========================================================================

const httpApi = require('../lib/httpApi.js');
const lib = require('../lib/lib.js');
const https = require('https');

jest.mock('https');
jest.mock('../lib/lib.js');

describe('httpApi.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('callApi', () => {
        it('should emit parsed JSON result to clients', done => {
            // Mock IP extraction
            lib.getIpAddressFromLocation.mockReturnValue('192.168.1.100');

            // Mock https.get
            const mockRes = {
                on: jest.fn((event, cb) => {
                    if (event === 'data') cb('{"key":"value"}');
                    if (event === 'end') cb();
                    return mockRes;
                })
            };
            https.get.mockImplementation((url, options, cb) => {
                cb(mockRes);
                return { on: jest.fn() };
            });

            // Mock io.emit
            const io = { emit: jest.fn() };
            httpApi.callApi(io, 'testcmd', { selectedDevice: { location: 'http://192.168.1.100:8080/desc.xml' } });

            setTimeout(() => {
                expect(io.emit).toHaveBeenCalledWith('device-api', 'testcmd', { key: 'value' });
                done();
            }, 10);
        });

        it('should emit raw result if JSON parsing fails', done => {
            lib.getIpAddressFromLocation.mockReturnValue('192.168.1.100');
            const mockRes = {
                on: jest.fn((event, cb) => {
                    if (event === 'data') cb('not json');
                    if (event === 'end') cb();
                    return mockRes;
                })
            };
            https.get.mockImplementation((url, options, cb) => {
                cb(mockRes);
                return { on: jest.fn() };
            });

            const io = { emit: jest.fn() };
            httpApi.callApi(io, 'badjson', { selectedDevice: { location: 'http://192.168.1.100:8080/desc.xml' } });

            setTimeout(() => {
                expect(io.emit).toHaveBeenCalledWith('device-api', 'badjson', 'not json');
                done();
            }, 10);
        });

        it('should emit null if there is an error', done => {
            lib.getIpAddressFromLocation.mockReturnValue('192.168.1.100');
            https.get.mockImplementation((url, options, cb) => {
                return {
                    on: (event, cb) => {
                        if (event === 'error') cb(new Error('fail'));
                        return {};
                    }
                };
            });

            const io = { emit: jest.fn() };
            httpApi.callApi(io, 'errorcmd', { selectedDevice: { location: 'http://192.168.1.100:8080/desc.xml' } });

            setTimeout(() => {
                expect(io.emit).toHaveBeenCalledWith('device-api', 'errorcmd', null);
                done();
            }, 10);
        });

        it('should not call https.get if no IP address', () => {
            lib.getIpAddressFromLocation.mockReturnValue(null);
            const io = { emit: jest.fn() };
            httpApi.callApi(io, 'noip', { selectedDevice: {} });
            expect(https.get).not.toHaveBeenCalled();
        });
    });
});