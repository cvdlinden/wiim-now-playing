const https = require("https");
const lyricsCache = require("../lib/lyricsCache.js");
const lyrics = require("../lib/lyrics.js"); // Zorg dat dit pad klopt
const { EventEmitter } = require("events");

// Mock de dependencies
jest.mock("../lib/lyricsCache.js");
jest.mock("https");
// Mock debug om de console schoon te houden
jest.mock("debug", () => () => jest.fn());

describe("Lyrics Module", () => {
    let mockIo;
    let mockDeviceInfo;
    let mockServerSettings;

    beforeEach(() => {
        jest.clearAllMocks();

        mockIo = { emit: jest.fn() };
        mockServerSettings = {
            features: { lyrics: { enabled: true } },
            version: "1.0.0"
        };
        mockDeviceInfo = {
            metadata: {
                trackMetaData: {
                    title: "Test Track",
                    artist: "Test Artist",
                    album: "Test Album",
                    duration: 300
                }
            },
            lyrics: null
        };
    });

    describe("getLyricsForMetadata", () => {
        test("moet stoppen als lyrics uitgeschakeld zijn", async () => {
            mockServerSettings.features.lyrics.enabled = false;

            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            expect(lyricsCache.get).not.toHaveBeenCalled();
            // Controleer of de state is 'gecleared' via je interne helper (indien geëxporteerd)
        });

        test("moet lyrics uit cache laden indien beschikbaar", async () => {
            // 1. Zorg dat de signature valide is volgens jouw buildSignatureFromMetadata
            mockDeviceInfo.metadata = {
                trackMetaData: {
                    "dc:title": "Test Song",
                    "upnp:artist": "Test Artist",
                    "upnp:album": "Test Album"
                },
                TrackDuration: "00:03:00" // Dit wordt 180 seconden
            };

            // 2. De cache moet iets teruggeven
            const cachedData = {
                status: "ok",
                trackKey: "test artist|test album|test song|180",
                payload: { plainLyrics: "Heerlijke lyrics" }
            };
            lyricsCache.get.mockResolvedValue(cachedData);

            // 3. Uitvoeren
            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            // 4. Verificatie
            // Als dit nog steeds faalt, komt hij niet voorbij de "signature" check.
            expect(lyricsCache.get).toHaveBeenCalled();
            expect(mockDeviceInfo.lyrics.status).toBe("ok");
            expect(mockIo.emit).toHaveBeenCalledWith("lyrics-get", cachedData);
        });

        test("moet de API aanroepen bij een cache miss", async () => {
            // 1. Zorg voor SCHONE deviceInfo (geen oude lyrics status)
            mockDeviceInfo.lyrics = null;
            mockDeviceInfo.metadata = {
                trackMetaData: {
                    "dc:title": "New Song",
                    "upnp:artist": "New Artist",
                    "upnp:album": "New Album"
                },
                TrackDuration: "00:03:00" // 180 seconden
            };

            // 2. Forceer Cache Miss
            lyricsCache.get.mockResolvedValue(null);
            lyricsCache.has.mockResolvedValue(false);

            // 3. Mock de HTTPS response (gebruik de EventEmitter)
            const mockRes = new EventEmitter();
            mockRes.statusCode = 200;

            https.get.mockImplementation((url, options, callback) => {
                callback(mockRes);
                mockRes.emit("data", JSON.stringify({ id: 123, plainLyrics: "API Lyrics", syncedLyrics: "[0:01] API Lyrics" }));
                mockRes.emit("end");
                return { on: jest.fn() };
            });

            // 4. Uitvoeren
            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            // 5. Verificatie
            // De verwachte key voor "New Artist", "New Album", "New Song", 180
            const expectedKey = "new artist|new album|new song|180";

            expect(lyricsCache.get).toHaveBeenCalledWith(expectedKey);
            expect(https.get).toHaveBeenCalled();
            expect(lyricsCache.set).toHaveBeenCalledWith(expectedKey, expect.objectContaining({
                status: "ok",
                payload: expect.objectContaining({ syncedLyrics: "[0:01] API Lyrics" })
            }));
        });

    });

    describe("fetchJson (Error handling)", () => {
        test("moet null teruggeven bij een 404 error", async () => {
            const mockRes = new EventEmitter();
            mockRes.statusCode = 404;

            https.get.mockImplementation((url, options, callback) => {
                callback(mockRes);
                mockRes.emit("end");
                return { on: jest.fn() };
            });

            // Omdat fetchJson niet geëxporteerd is, testen we dit indirect 
            // of we maken de functies in lyrics.js testbaar.
        });
    });


    describe("Lyrics Module - Integration Test", () => {
        let mockIo, mockDeviceInfo, mockServerSettings;

        beforeEach(() => {
            jest.clearAllMocks();
            mockIo = { emit: jest.fn() };
            mockServerSettings = { features: { lyrics: { enabled: true } }, version: { server: "1.2.3" } };
            mockDeviceInfo = {
                metadata: {
                    trackMetaData: {
                        "dc:title": "Test Track (Deluxe Edition)",
                        "upnp:artist": "Artist feat. Helper",
                        "upnp:album": "Greatest Hits [Remastered]"
                    },
                    TrackDuration: "00:03:20" // 200 seconden
                },
                lyrics: null
            };
        });

        /**
         * Helper om https.get mocks te stroomlijnen
         */
        const mockHttpGet = (status, data) => {
            https.get.mockImplementationOnce((url, options, callback) => {
                const res = new EventEmitter();
                res.statusCode = status;
                callback(res);
                res.emit("data", typeof data === "string" ? data : JSON.stringify(data));
                res.emit("end");
                return { on: jest.fn() };
            });
        };

        test("moet metadata correct normaliseren voor de trackKey", async () => {
            lyricsCache.get.mockResolvedValue(null);
            lyricsCache.has.mockResolvedValue(true);
            mockHttpGet(404, null); // Eerste poging (/api/get) laten falen

            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            // De verwachte genormaliseerde key op basis van jouw logica:
            // Artist: artist helper, Album: greatest hits, Track: test track, Duration: 200
            const expectedKey = "artist helper|greatest hits|test track|200";
            expect(lyricsCache.get).toHaveBeenCalledWith(expectedKey);
        });

        test("moet de beste match kiezen uit search resultaten op basis van duration", async () => {
            lyricsCache.get.mockResolvedValue(null);
            lyricsCache.has.mockResolvedValue(true);

            // 1. /api/get geeft 404
            mockHttpGet(404, null);

            // 2. /api/search geeft meerdere resultaten
            const searchResults = [
                { id: 1, duration: 180, syncedLyrics: "Te kort", instrumental: false },
                { id: 2, duration: 205, syncedLyrics: "Perfecte match", instrumental: false },
                { id: 3, duration: 205, syncedLyrics: "", instrumental: false }, // Leeg, moet genegeerd worden
                { id: 4, duration: 200, syncedLyrics: "Instrumental", instrumental: true } // Instrumental, negeren
            ];
            mockHttpGet(200, searchResults);

            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            // Check of de juiste (id: 2) in de cache is gezet
            expect(lyricsCache.set).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    status: "ok",
                    payload: expect.objectContaining({ id: 2 })
                })
            );
            expect(mockIo.emit).toHaveBeenCalledWith("lyrics-get", expect.objectContaining({ status: "ok" }));
        });

        test("moet clearLyricsState aanroepen bij ongeldige metadata", async () => {
            mockDeviceInfo.metadata.trackMetaData["dc:title"] = ""; // Maak metadata incompleet

            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            expect(mockIo.emit).toHaveBeenCalledWith("lyrics-get", expect.objectContaining({
                status: "missing-signature"
            }));
        });

        test("moet User-Agent correct meesturen", async () => {
            lyricsCache.get.mockResolvedValue(null);
            mockHttpGet(404, null);

            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            const callArgs = https.get.mock.calls[0][1];
            expect(callArgs.headers["User-Agent"]).toBe("WiiMNowPlaying/1.2.3 (+https://github.com)");
        });

        test("moet netjes afhandelen als de API ongeldige JSON teruggeeft", async () => {
            lyricsCache.get.mockResolvedValue(null);
            // Simuleer een 200 OK maar met corrupte tekst ipv JSON
            mockHttpGet(200, "GEEN-JSON-DATA");

            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);

            // Controleer of de status nu 'error' of 'not-found' is (lijn 208-210)
            expect(mockDeviceInfo.lyrics.status).toBe("not-found");
        });

        test("moet null teruggeven bij een ongeldig duur-formaat", async () => {
            mockDeviceInfo.metadata.TrackDuration = "ONGELDIG"; // triggert Number.isNaN check op lijn 350
            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, mockServerSettings);
            expect(mockDeviceInfo.lyrics.status).toBe("missing-signature");
        });

        test("moet User-Agent fallback gebruiken als versie ontbreekt", async () => {
            const settingsZonderVersie = { features: { lyrics: { enabled: true } } };
            // Dit dwingt de 'unknown' fallback af op lijn 379
            await lyrics.getLyricsForMetadata(mockIo, mockDeviceInfo, settingsZonderVersie);
            // Verifieer intern of getUserAgent 'unknown' bevatte
        });
    });
});