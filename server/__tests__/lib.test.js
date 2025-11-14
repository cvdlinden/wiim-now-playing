// ===========================================================================
// lib.test.js 
//
// Unit tests for the lib.js module.
// Uses Jest as the testing framework.
// ===========================================================================

const lib = require('../lib/lib.js');
const fs = require('fs');
const path = require('path');

describe('lib.js', () => {
    describe('getDate', () => {
        it('should return a valid UTC date string', () => {
            const date = lib.getDate();
            expect(typeof date).toBe('string');
            expect(new Date(date).toUTCString()).toBe(date);
        });
    });

    describe('getTimeStamp', () => {
        it('should return a number representing the current timestamp', () => {
            const ts = lib.getTimeStamp();
            expect(typeof ts).toBe('number');
            expect(ts).toBeLessThanOrEqual(Date.now());
        });
    });

    describe('getOS', () => {
        it('should return an object with OS info', () => {
            const osInfo = lib.getOS();
            expect(osInfo).toHaveProperty('arch');
            expect(osInfo).toHaveProperty('hostname');
            expect(osInfo).toHaveProperty('platform');
            expect(osInfo).toHaveProperty('release');
            expect(osInfo).toHaveProperty('userInfo');
            expect(osInfo).toHaveProperty('version');
            expect(osInfo).toHaveProperty('machine');
            expect(osInfo).toHaveProperty('networkInterfaces');
        });
    });

    describe('getIpAddressFromLocation', () => {
        it('should extract IP address from location URL', () => {
            const serverSettings = {
                selectedDevice: {
                    location: 'http://192.168.1.100:8080/desc.xml'
                }
            };
            expect(lib.getIpAddressFromLocation(serverSettings)).toBe('192.168.1.100');
        });

        it('should return null if location is missing', () => {
            const serverSettings = { selectedDevice: {} };
            expect(lib.getIpAddressFromLocation(serverSettings)).toBeNull();
        });
    });

    describe('getSettings and saveSettings', () => {
        const testSettingsFile = path.join(__dirname, '../settings.json');
        const backupFile = testSettingsFile + '.bak';

        beforeAll(() => {
            // Backup existing settings file if present
            if (fs.existsSync(testSettingsFile)) {
                fs.copyFileSync(testSettingsFile, backupFile);
            }
        });

        afterAll(() => {
            // Restore backup
            if (fs.existsSync(backupFile)) {
                fs.copyFileSync(backupFile, testSettingsFile);
                fs.unlinkSync(backupFile);
            } else if (fs.existsSync(testSettingsFile)) {
                fs.unlinkSync(testSettingsFile);
            }
        });

        it('should save and get settings correctly', (done) => {
            const serverSettings = {
                selectedDevice: {
                    friendlyName: 'Test Device',
                    location: 'http://192.168.1.101:8080/desc.xml',
                    actions: {}
                }
            };
            lib.saveSettings(serverSettings);

            setTimeout(() => {
                const loadedSettings = { selectedDevice: {} };
                lib.getSettings(loadedSettings);
                expect(loadedSettings.selectedDevice.friendlyName).toBe('Test Device');
                expect(loadedSettings.selectedDevice.location).toBe('http://192.168.1.101:8080/desc.xml');
                done();
            }, 100);
        });
    });
});