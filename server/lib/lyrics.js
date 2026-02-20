// ===========================================================================
// lyrics.js

/**
 * Lyrics module.
 * Handles the lyrics back-end by fetching (synced) lyrics and caching them.
 * This module uses LRCLIB to fetch lyrics from their API.
 * @module
 */

const https = require("https");
const lyricsCache = require("./lyricsCache.js");
const util = require('util');
const log = require("debug")("lib:lyrics");

const LRCLIB_BASE_URL = "https://lrclib.net";

/**
 * Get the lyrics for the current metadata
 * Starting point for lyrics library, sets the current lyrics state
 * @param {object} io 
 * @param {object} deviceInfo 
 * @param {object} serverSettings 
 * @returns {void}
 */
const getLyricsForMetadata = async (io, deviceInfo, serverSettings) => {
    // log("getLyricsForMetadata()");

    // Are lyrics enabled?
    const enabled = serverSettings?.features?.lyrics?.enabled;
    if (!enabled) {
        log("Lyrics disabled! Skip.")
        clearLyricsState(io, deviceInfo, "disabled", null, null);
        return;
    }

    // Do we have any metadata to work with?
    if (!deviceInfo.metadata || !deviceInfo.metadata.trackMetaData) {
        // log("No metadata found to fetch lyrics for. Skip.")
        clearLyricsState(io, deviceInfo, "no-metadata", null, null);
        return;
    }

    // Do we have track, artist, album and duration?
    const signature = buildSignatureFromMetadata(deviceInfo.metadata);
    if (!signature) {
        // log("Missing or invalid signature. Skip.")
        clearLyricsState(io, deviceInfo, "missing-signature", null, null);
        return;
    }

    // Are we already using the proper lyrics?
    const trackKey = buildTrackKey(signature);
    if (deviceInfo.lyrics && deviceInfo.lyrics.trackKey === trackKey && ["ok", "not-found"].includes(deviceInfo.lyrics.status)) {
        // log(`Lyrics state already current: '${deviceInfo.lyrics.status}', '${trackKey}'. Skip.`);
        return;
    }

    // Try and get lyrics from cache...
    let cacheLookup = await lyricsCache.get(trackKey);
    if (!cacheLookup) {
        log(`[Cache Miss] Fetching API for '${trackKey}'...`);

        try {
            const cacheEntry = await fetchLyrics(signature, trackKey, serverSettings);
            if (cacheEntry) {
                // log("Lyrics fetched from API!")
                setLyricsState(io, deviceInfo, {
                    ...cacheEntry
                });
                return;
            }
            else {
                log("Lyrics not found from API!")
                clearLyricsState(io, deviceInfo, "not-found", signature, trackKey);
            }
        } catch (error) {
            log("LRCLIB error:", error.message);
            clearLyricsState(io, deviceInfo, "error", signature, trackKey);
        }

    } else {
        log(`[Cache Hit] Entry present for ${trackKey}, status ${cacheLookup?.status}`);
        setLyricsState(io, deviceInfo, {
            ...cacheLookup
        });
    }
};

/**
 * Fetch the lyrics from the API and store it in the cache
 * First we try /api/get, if no result we try /api/search
 * If nothing is found, we cache the status only
 * @param {object} signature 
 * @param {string} trackKey 
 * @param {object} serverSettings 
 * @returns {Promise<object>}
 */
const fetchLyrics = async (signature, trackKey, serverSettings) => {
    log("fetchLyrics()");

    // Set cache pending, if not already present
    const hasCache = await lyricsCache.has(trackKey);
    if (!hasCache) {
        lyricsCache.set(trackKey, { status: "pending", signature: signature, trackKey: trackKey, payload: null });
    }

    // Look for lyrics info from API using /api/get
    const params = new URLSearchParams({
        track_name: signature.trackName,
        artist_name: signature.artistName,
        album_name: signature.albumName,
        duration: signature.duration
    });
    const getResult = await fetchJson(`/api/get?${params.toString()}`, serverSettings);

    // Did we get anything from the API?
    // If so, did we get synced lyrics?
    if (getResult && getResult.syncedLyrics) {
        const cacheEntry = { status: "ok", signature: signature, trackKey: trackKey, payload: getResult };
        lyricsCache.set(trackKey, cacheEntry);
        // let keyCount = await lyricsCache.count();
        log("Cache entries:", await lyricsCache.count())
        return cacheEntry;
    }
    else {
        const searchParams = new URLSearchParams({
            track_name: signature.trackName,
            artist_name: signature.artistName,
            album_name: signature.albumName
        });
        const searchResult = await fetchJson(`/api/search?${searchParams.toString()}`, serverSettings)

        // Did we get anything from a search?
        if (searchResult) {
            // Possibly we are getting multiple results...
            // So we want the closest for duration, which isn't instrumental and had syncedLyrics
            const targetDuration = signature.duration;
            const closest = searchResult
                .filter(track =>
                    !track.instrumental &&               // No instrumentals
                    track.syncedLyrics &&                // Has synced lyrics
                    track.syncedLyrics.trim().length > 0 // And synced lyrics shouldn't be empty
                )
                .reduce((prev, curr) => {
                    // If the list was empty, prev would be null
                    if (prev === null) return curr;
                    const currDiff = Math.abs(curr.duration - targetDuration);
                    const prevDiff = Math.abs(prev.duration - targetDuration);
                    // If we have a tie keep the first ('prev')
                    return currDiff < prevDiff ? curr : prev;
                }, null);
            if (closest) {
                const cacheEntry = { status: "ok", signature: signature, trackKey: trackKey, payload: closest };
                lyricsCache.set(trackKey, cacheEntry);
                return cacheEntry
            }
            else {
                const cacheEntry = { status: "not-found", signature: signature, trackKey: trackKey, payload: null };
                lyricsCache.set(trackKey, cacheEntry);
                return cacheEntry
            }
        }
        else {
            const cacheEntry = { status: "not-found", signature: signature, trackKey: trackKey, payload: null };
            lyricsCache.set(trackKey, cacheEntry);
            return cacheEntry
        }

    }
};

/**
 * Fetch the json from the API
 * Uses a https.get
 * @param {string} path 
 * @returns 
 */
const fetchJson = (path, serverSettings) => new Promise((resolve, reject) => {
    const url = `${LRCLIB_BASE_URL}${path}`;
    log("fetchJson()", url)
    const req = https.get(url, {
        headers: {
            "User-Agent": getUserAgent(serverSettings)
        }
    }, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                log("API:", res.statusCode, res.statusMessage);
                try {
                    // log("API data returning...")
                    resolve(JSON.parse(data));
                } catch (error) {
                    log("API error:", error)
                    resolve(null);
                    // reject(error);
                }
            } else if (res.statusCode === 404) {
                log("API: 404 Not found")
                resolve(null);
            } else {
                log("API error:", res.statusCode)
                resolve(null);
                // reject(new Error(`LRCLIB request failed with status ${res.statusCode}`));
            }
        });
    });
    req.on("error", (error) => {
        log("API error:", error)
        resolve(null);
        // reject
    });
});

/**
 * Sets and emits the current Lyrics state
 * @param {object} io 
 * @param {object} deviceInfo 
 * @param {object} payload 
 */
const setLyricsState = (io, deviceInfo, lyricsState) => {
    // log("setLyricsState()")
    // Has the current lyrics state already been set?
    if (util.isDeepStrictEqual(deviceInfo.lyrics, lyricsState)) {
        return;
    }
    // Else set the current lyrics state
    log("setLyricsState() - state changed:", `status = ${lyricsState?.status}; trackKey: ${lyricsState?.trackKey}; payloadId: ${lyricsState?.payload?.id}`)
    deviceInfo.lyrics = lyricsState;
    io.emit("lyrics-get", lyricsState);
};

/**
 * Clears the current Lyrics State
 * @param {object} io 
 * @param {object} deviceInfo 
 * @param {sting} reason 
 * @param {string} signature 
 * @param {string} trackKey 
 * @returns 
 */
const clearLyricsState = (io, deviceInfo, reason, signature, trackKey) => {
    // log("clearLyricsState()", reason)
    // If the existing lyrics state and trackKey are already set, skip.
    if (deviceInfo.lyrics && deviceInfo.lyrics.trackKey === trackKey && deviceInfo.lyrics.status === reason) {
        return;
    }
    // Else clear the current lyrics state...
    log("clearLyricsState()", reason)
    setLyricsState(io, deviceInfo, {
        status: reason,
        trackKey: trackKey || null,
        signature: signature || null,
        payload: null
    });
};

/**
 * Helper that builds a signature from the metadata.
 * Uses the track name, artist name, album name and duration.
 * @param {object} metadata 
 * @returns {object}
 */
const buildSignatureFromMetadata = (metadata) => {
    // log("buildSignatureFromMetadata()")
    const trackName = metadata?.trackMetaData?.["dc:title"] || "";
    const artistName = metadata?.trackMetaData?.["upnp:artist"] || "";
    const albumName = metadata?.trackMetaData?.["upnp:album"] || "";
    const duration = parseDurationToSeconds(metadata?.TrackDuration);

    if (!trackName || !artistName || !albumName || !duration) {
        return null;
    }

    // log(`buildSignatureFromMetadata() ${trackName}; ${artistName}; ${albumName}; ${duration}`)
    return { trackName, artistName, albumName, duration };
};

/**
 * Helper to construct the track key
 * @param {object} signature 
 * @returns {object}
 */
const buildTrackKey = (signature) => {
    // log("buildTrackKey()");
    const base = [
        normalizeText(signature.artistName),
        normalizeAlbum(signature.albumName),
        normalizeText(signature.trackName),
        normalizeDurationForKey(signature.duration)
    ].join("|");
    // log("buildTrackKey()", base);
    return base;
};

/**
 * Helper to normalize text values
 * For instance for track, artist and album name
 * @param {string} value 
 * @returns {string}
 */
const normalizeText = (value) => {
    // log("normalizeText()")
    if (!value) {
        return "";
    }
    return value
        .toLowerCase()
        .replace(/\([^)]*\)/g, " ")
        .replace(/\[[^\]]*\]/g, " ")
        .replace(/&/g, " and ")
        .replace(/feat\.?/g, " ")
        .replace(/ft\.?/g, " ")
        .replace(/[-–—]/g, " ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

/**
 * Helper to normalize album name
 * @param {string} value 
 * @returns {string}
 */
const normalizeAlbum = (value) => {
    // log("normalizeAlbum()")
    return normalizeText(value)
        .replace(/\b(deluxe|edition|remaster(ed)?|expanded|bonus|anniversary|live|acoustic|mono|stereo|version)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

/**
 * Helper to parse duration (hh:)mm:ss to seconds total
 * @param {string} duration 
 * @returns 
 */
const parseDurationToSeconds = (duration) => {
    // log("parseDurationToSeconds()");
    if (!duration) {
        return null;
    }
    if (typeof duration === "number") {
        return Math.round(duration);
    }
    const parts = duration.split(":").map((item) => parseInt(item, 10));
    if (parts.some((item) => Number.isNaN(item))) {
        return null;
    }
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return null;
};

/**
 * Helper to fix duration.
 * TODO: Candidate for removal???
 * @param {int} duration 
 * @returns {int}
 */
const normalizeDurationForKey = (duration) => {
    // log("normalizeDurationForKey()")
    if (duration === null || duration === undefined) {
        return "";
    }
    if (typeof duration === "number" && Number.isFinite(duration)) {
        return Math.round(duration);
    }
    return duration;
};

/**
 * Helper to construct a UserAgent string
 * @param {object} serverSettings 
 * @returns {string}
 */
const getUserAgent = (serverSettings) => {
    // log("getUserAgent()", serverSettings?.version)
    const version = serverSettings?.version?.server || "unknown";
    const userAgent = `WiiMNowPlaying/${version} (+https://github.com)`
    // log("getUserAgent()", userAgent)
    return userAgent;
};

module.exports = {
    getLyricsForMetadata
};
