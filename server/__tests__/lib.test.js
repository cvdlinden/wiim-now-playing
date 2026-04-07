// ===========================================================================
// lib.test.js 
//
// Unit tests for the lib.js module.
// Uses Jest as the testing framework.
// ===========================================================================

const lib = require('../lib/lib.js');
const fs = require('fs');
const path = require('path');
jest.mock('fs');
jest.mock('debug', () => () => jest.fn());

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

    describe('getSettings and saveSettings (Mocked)', () => {

        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('moet diepe lyrics cache settings mergen (L94-115)', () => {
            // 1. De "default" server settings
            const serverSettings = {
                features: { lyrics: { enabled: false, cache: { ttl: 3600 } } }
            };

            // 2. De gesimuleerde file-inhoud (diepe structuur)
            const mockFileData = JSON.stringify({
                selectedDevice: { friendlyName: 'Mock', location: 'loc', actions: 'act' },
                features: {
                    lyrics: { enabled: true, cache: { ttl: 5000 } }
                }
            });
            fs.readFileSync.mockReturnValue(mockFileData);

            // 3. Act
            lib.getSettings(serverSettings);

            // 4. Assert - Check of de merge tot diep in de cache-settings werkt
            expect(serverSettings.features.lyrics.enabled).toBe(true);
            expect(serverSettings.features.lyrics.cache.ttl).toBe(5000);
        });

        // test('moet saveSettings aanroepen als readFileSync faalt (L117-121)', () => {
        //     // Forceer de 'catch' block in getSettings
        //     fs.readFileSync.mockImplementation(() => { throw new Error('File not found'); });

        //     // We moeten saveSettings mocken om te zien of hij wordt aangeroepen
        //     const saveSpy = jest.spyOn(lib, 'saveSettings').mockImplementation(() => { });

        //     lib.getSettings({ features: {} });

        //     expect(saveSpy).toHaveBeenCalled();
        //     saveSpy.mockRestore();
        // });

        test('moet sanity check loggen bij ongeldige device data (L83-84)', () => {
            const invalidData = JSON.stringify({ selectedDevice: { friendlyName: 'Alleen Naam' } });
            fs.readFileSync.mockReturnValue(invalidData);

            const serverSettings = { selectedDevice: {} };
            lib.getSettings(serverSettings);

            // De code passeert L83-84 omdat location/actions missen
            expect(serverSettings.selectedDevice).toEqual({});
        });

        test('moet writeFile correct aanroepen in saveSettings (L131-152)', (done) => {
            const settings = { selectedDevice: 'test', features: 'test' };

            // Mock de callback van writeFile (L138)
            fs.writeFile.mockImplementation((path, data, enc, cb) => {
                cb(null); // Roep callback aan zonder error
                done();
            });

            lib.saveSettings(settings);
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test('moet de error-tak van writeFile loggen (L148-150)', (done) => {
            // Simuleer een disk-error in de callback
            fs.writeFile.mockImplementation((path, data, enc, cb) => {
                cb(new Error('Disk Full'));
                done();
            });

            lib.saveSettings({ features: {} });
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test('moet branches dekken waar features of lyrics missen in de file (L99-104)', () => {
            // Test 1: File heeft GEEN features (triggert de 'false' branch van if (settings.features))
            const settingsNoFeatures = JSON.stringify({
                selectedDevice: { location: 'loc', actions: 'act' }
            });
            fs.readFileSync.mockReturnValue(settingsNoFeatures);
            const serverSettings1 = { features: { lyrics: { enabled: true } } };
            lib.getSettings(serverSettings1);
            expect(serverSettings1.features.lyrics.enabled).toBe(true); // Ongewijzigd

            // Test 2: File heeft features, maar GEEN lyrics (triggert de 'false' branch van if (settings.features.lyrics))
            const settingsNoLyrics = JSON.stringify({
                selectedDevice: { location: 'loc', actions: 'act' },
                features: { other: true }
            });
            fs.readFileSync.mockReturnValue(settingsNoLyrics);
            const serverSettings2 = { features: { lyrics: { enabled: true } } };
            lib.getSettings(serverSettings2);
            expect(serverSettings2.features.lyrics.enabled).toBe(true); // Ongewijzigd
        });

        test('should call the catch block and invoke saveSettings when readFileSync fails', () => {
            // Force the catch block by making readFileSync throw
            fs.readFileSync.mockImplementation(() => { throw new Error('ENOENT: no such file or directory'); });
            fs.writeFile.mockImplementation(() => {}); // Prevent real disk write

            const serverSettings = { selectedDevice: {}, features: {} };
            lib.getSettings(serverSettings);

            // saveSettings is called inside the catch block
            expect(fs.writeFile).toHaveBeenCalled();
        });

        test('moet de branches van lyrics en cache checks volledig dekken (L104-113)', () => {
            // 1. Setup serverSettings met de volledige hiërarchie
            const serverSettings = {
                features: {
                    lyrics: {
                        enabled: true
                    }
                }
            };

            // 2. Scenario A: File heeft features, maar GEEN lyrics (triggert de 'false' branch van L104)
            fs.readFileSync.mockReturnValue(JSON.stringify({
                selectedDevice: { location: 'loc', actions: 'act' },
                features: { somethingElse: true }
            }));
            lib.getSettings(serverSettings);
            expect(serverSettings.features.lyrics.enabled).toBe(true);

            // 3. Scenario B: File heeft lyrics, maar GEEN cache (triggert de 'false' branch van L110)
            fs.readFileSync.mockReturnValue(JSON.stringify({
                selectedDevice: { location: 'loc', actions: 'act' },
                features: {
                    lyrics: { enabled: "updated" }
                }
            }));
            lib.getSettings(serverSettings);
            expect(serverSettings.features.lyrics.enabled).toBe("updated");
        });
    });
});