// ===========================================================================
// lyrics.js
//
// Lyrics integration (LRCLIB)

/**
 * ATTENTION: CACHE STRATEGY & HARDWARE CONSTRAINTS
 * 
 * This module will be refactored from the original PR. 
 * Original implementation uses node:sqlite, which is avoided here because:
 * 1. HARDWARE: This app is designed to run on Raspberry Pi with SD cards. Frequent SQL writes 
 *    (journaling/WAL) drastically shorten SD card lifespan.
 * 2. PERFORMANCE: JSON blobs are better handled in-memory or via simple key-value stores.
 * 
 * STRATEGY: 
 * - Use In-Memory storage for high-frequency access.
 * - [Optional: Persist to disk only on exit or intervals to save the SD card.]
 * 
 */

const https = require("https");
const lyricsCache = require("./lyricsCache.js");
const log = require("debug")("lib:lyrics");

const LRCLIB_BASE_URL = "https://lrclib.net";
// const NEGATIVE_CACHE_TTL_MS = 10 * 60 * 1000;
// const MATCH_SCORE_THRESHOLD = 70;
// const PREFETCH_BATCH_LIMIT = 20;
// const PREFETCH_CONCURRENCY_FALLBACK = 4;
// const PREFETCH_MODES = {
//     OFF: "off",
//     ALBUM: "album"
// };

// const negativeCache = new Map();
// const inFlightRequests = new Map();
// const prefetchInFlight = new Map();

/**
 * Get the lyrics for the current metadata
 * Starting point for lyrics library, sets the current lyrics state
 * @param {object} io 
 * @param {object} deviceInfo 
 * @param {object} serverSettings 
 * @returns {void}
 */
const getLyricsForMetadata = async (io, deviceInfo, serverSettings) => {
    log("getLyricsForMetadata()");

    // Are lyrics enabled?
    const enabled = serverSettings?.features?.lyrics?.enabled;
    if (!enabled) {
        log("Lyrics disabled!")
        clearLyricsState(io, deviceInfo, "disabled", null, null);
        return;
    }

    // Do we have metadata?
    const metadata = deviceInfo.metadata;
    if (!metadata || !metadata.trackMetaData) {
        log("No metadata found to fetch lyrics for.")
        clearLyricsState(io, deviceInfo, "no-metadata", null, null);
        return;
    }

    // Do we have track, artist, album and duration?
    const signature = buildSignatureFromMetadata(metadata);
    if (!signature) {
        log("Missing signature or incomplete...")
        clearLyricsState(io, deviceInfo, "missing-signature", null, null);
        return;
    }

    // Create a unique key for this track
    const trackKey = buildTrackKey(signature);
    // Are we already using the proper lyrics?
    if (deviceInfo.lyrics && deviceInfo.lyrics.trackKey === trackKey && deviceInfo.lyrics.status === "ok") {
        log("Lyrics already in play, skipping...");
        return;
    }

    // Are the lyrics already in cache?
    let cacheLookup = await lyricsCache.get(trackKey);
    if (!cacheLookup) {
        log(`[Cache Miss] Fetching API for '${trackKey}'...`);

        try {
            // const payload = await fetchLyricsForSignature(signature, trackKey, serverSettings, null);
            const payload = await fetchLyrics(signature, trackKey);
            if (payload) {
                // log("Lyrics fetched from API!")
                setLyricsState(io, deviceInfo, {
                    ...payload,
                });
                // schedulePrefetchForSignature(io, signature, serverSettings, {
                //     reason: "live-fetch"
                // });
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
        // schedulePrefetchForSignature(io, signature, serverSettings, {
        //     reason: "cache-hit"
        // });
        return;
    }
};

/**
 * Fetch the lyrics from the API and store it in the cache
 * First we try /api/get, if no result we try /api/search
 * If nothing is found, we cache the status only
 * @param {object} signature 
 * @param {string} trackKey 
 * @returns 
 */
const fetchLyrics = async (signature, trackKey) => {
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
    const getResult = await fetchJson(`/api/get?${params.toString()}`)
    // const getResult = await fetchJson(`/api/get?${params.toString()}`)

    // Did we get anything from the API?
    if (getResult) {
        const cacheEntry = { status: "ok", signature: signature, trackKey: trackKey, payload: getResult };
        lyricsCache.set(trackKey, cacheEntry);
        let keyCount = await lyricsCache.count();
        // log("Cache entries:", keyCount)
        return cacheEntry;
    }
    else {
        const searchParams = new URLSearchParams({
            track_name: signature.trackName,
            artist_name: signature.artistName,
            album_name: signature.albumName
        });
        const searchResult = await fetchJson(`/api/search?${searchParams.toString()}`)

        // Did we get anything from a search?
        if (searchResult) {
            // Currently doing first one in, but we should filter on proper lyrics...
            const cacheEntry = { status: "ok", signature: signature, trackKey: trackKey, payload: searchResult[0] };
            lyricsCache.set(trackKey, cacheEntry);
            return cacheEntry
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
const fetchJson = (path) => new Promise((resolve, reject) => {
    const url = `${LRCLIB_BASE_URL}${path}`;
    log("fetchJson()", url)
    const req = https.get(url, {
        // headers: {
        //     "User-Agent": getUserAgent(serverSettings)
        // }
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
                    reject(error);
                }
            } else if (res.statusCode === 404) {
                log("API: 404 Not found")
                resolve(null);
            } else {
                log("API error:", res.statusCode)
                reject(new Error(`LRCLIB request failed with status ${res.statusCode}`));
            }
        });
    });
    req.on("error", (error) => {
        log("API error:", error)
        reject
    });
});

/**
 * Sets and emits the current Lyrics state
 * @param {object} io 
 * @param {object} deviceInfo 
 * @param {object} payload 
 */
const setLyricsState = (io, deviceInfo, payload) => {
    log("setLyricsState()")
    deviceInfo.lyrics = payload;
    log("Lyrics STATE:", `status = ${payload?.status}; trackKey: ${payload?.trackKey}; payloadId: ${payload?.payload?.id}`)
    io.emit("lyrics", payload);
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
    log("clearLyricsState()")
    if (deviceInfo.lyrics && deviceInfo.lyrics.trackKey === trackKey && deviceInfo.lyrics.status === reason) {
        return;
    }
    setLyricsState(io, deviceInfo, {
        status: reason,
        trackKey: trackKey || null,
        signature: signature || null,
    });
};

// /**
//  * Fetch the lyrics for the specific signature (track, artist, album and duration)
//  * @param {object} signature 
//  * @param {string} trackKey 
//  * @param {object} serverSettings 
//  * @param {object} options 
//  */
// const fetchLyricsForSignature = async (signature, trackKey, serverSettings, options = {}) => {
//     log("fetchLyricsForSignature()")
//     // const withPrefetchMetadata = (payload) => {
//     //     if (!options.prefetch) {
//     //         return payload;
//     //     }
//     //     return {
//     //         ...payload,
//     //         prefetch: {
//     //             source: options.prefetch.source || "unknown",
//     //             startedAt: options.prefetch.startedAt,
//     //             totalMs: Date.now() - options.prefetch.startedAt
//     //         }
//     //     };
//     // };

//     // const cacheLookup = await lyricsCache.get(trackKey);
//     // log("Cache lookup", cacheLookup)
//     // if (cacheLookup.status === "hit" && cacheLookup.payload) {
//     //     return withPrefetchMetadata(cacheLookup.payload);
//     // }

//     // const negative = negativeCache.get(trackKey);
//     // if (negative && negative.expiresAt > Date.now()) {
//     //     return withPrefetchMetadata(negative.payload);
//     // }

//     // const running = inFlightRequests.get(trackKey);
//     // if (running) {
//     //     return withPrefetchMetadata(await running);
//     // }

//     // Async request for lyrics...
//     const request = (async () => {
//         const lyrics = await fetchLyricsBySignature(signature, serverSettings);
//         if (lyrics && lyrics.syncedLyrics) {
//             log("Lyrics found!")
//             const payload = {
//                 status: "ok",
//                 // provider: "lrclib",
//                 trackKey,
//                 signature,
//                 id: lyrics.id,
//                 trackName: lyrics.trackName,
//                 artistName: lyrics.artistName,
//                 albumName: lyrics.albumName,
//                 duration: lyrics.duration,
//                 instrumental: lyrics.instrumental,
//                 syncedLyrics: lyrics.syncedLyrics
//             };
//             // setImmediate(async () => {
//             //     try {
//             //         const bestLyrics = await fetchBestLyricsBySignature(signature, serverSettings, null);
//             //         const candidate = bestLyrics || lyrics;
//             //         const bestPayload = {
//             //             ...payload,
//             //             id: candidate.id,
//             //             trackName: candidate.trackName,
//             //             artistName: candidate.artistName,
//             //             albumName: candidate.albumName,
//             //             duration: candidate.duration,
//             //             instrumental: candidate.instrumental,
//             //             syncedLyrics: candidate.syncedLyrics
//             //         };
//             //         // const storeResult = lyricsCache.storeLyrics(bestPayload, serverSettings);
//             //         // if (storeResult.stored) {
//             //         //     log(`Lyrics cached (${storeResult.size} bytes)`, trackKey);
//             //         // } else if (storeResult.error) {
//             //         //     log(`Lyrics cache store skipped (${storeResult.error})`, trackKey);
//             //         // }
//             //         lyricsCache.set(trackKey, bestPayload);
//             //     } catch (error) {
//             //         log("Lyrics cache write error:", error.message);
//             //     }
//             // });
//             return payload;
//         }
//         else {
//             log("Lyrics not found!")
//         }

//         const payload = {
//             status: "not-found",
//             // provider: "lrclib",
//             trackKey,
//             signature
//         };
//         // negativeCache.set(trackKey, {
//         //     payload,
//         //     expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS
//         // });
//         log("request completed!")
//         return payload;
//     })();

//     // inFlightRequests.set(trackKey, request);

//     // try {
//     //     const payload = await request;
//     //     return withPrefetchMetadata(payload);
//     // } finally {
//     //     inFlightRequests.delete(trackKey);
//     // }
// };

// const fetchLyricsBySignature = async (signature, serverSettings) => {
//     log("fetchLyricsBySignature()")
//     const params = new URLSearchParams({
//         track_name: signature.trackName,
//         artist_name: signature.artistName,
//         album_name: signature.albumName,
//         duration: signature.duration
//     });

//     const tasks = [
// {
//     label: "get-cached",
//     promise: fetchJson(`/api/get-cached?${params.toString()}`, serverSettings, "get-cached")
//     // promise: fetchJsonWithTiming(`/api/get-cached?${params.toString()}`, serverSettings, "get-cached")
// },
//         {
//             label: "get",
//             promise: fetchJson(`/api/get?${params.toString()}`, serverSettings, "get")
//             // promise: fetchJsonWithTiming(`/api/get?${params.toString()}`, serverSettings, "get")
//         },
//         {
//             label: "search",
//             promise: fetchLyricsFromSearch(signature, serverSettings)
//         }
//     ].map((task) => ({
//         label: task.label,
//         promise: task.promise
//             .then((result) => ({ status: "ok", label: task.label, result }))
//             .catch((error) => ({ status: "error", label: task.label, error }))
//     }));

//     const pending = [...tasks];
//     while (pending.length > 0) {
//         const settled = await Promise.race(pending.map((task) => task.promise));
//         const index = pending.findIndex((task) => task.label === settled.label);
//         if (index !== -1) {
//             pending.splice(index, 1);
//         }

//         if (settled.status === "ok" && isValidLyrics(settled.result)) {
//             log("SETTLED:", settled.label);
//             return settled.result;
//         }
//         else {
//             log("UNSETTLED:", settled.label);
//         }
//     }

//     return null;
// };

// const fetchJsonWithTiming = async (path, serverSettings, label) => {
//     log("fetchJsonWithTiming()", label, path)
//     // const startedAt = Date.now();
//     try {
//         const result = await fetchJson(path, serverSettings);
//         return result;
//     } catch (error) {
//         throw error;
//     }
// };

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

// const getCacheConfig = (serverSettings) => {
//     log("getCacheConfig()")
//     lyricsCache.getCacheConfig(serverSettings);
// }

// const getPrefetchMode = (serverSettings) => {
//     log("getPrefetchMode()")
//     const mode = getCacheConfig(serverSettings).prefetch;
//     if (mode === PREFETCH_MODES.ALBUM || mode === PREFETCH_MODES.OFF) {
//         return mode;
//     }
//     return PREFETCH_MODES.OFF;
// };

// const getUserAgent = (serverSettings) => {
//     log("getUserAgent()")
//     const version = serverSettings?.version?.server || "unknown";
//     return `WiiMNowPlaying/${version} (+https://github.com)`;
// };

// const scoreCandidate = (candidate, signature) => {
//     log("scoreCandidate()")
//     const trackName = normalizeText(candidate.trackName);
//     const artistName = normalizeText(candidate.artistName);
//     const albumName = normalizeAlbum(candidate.albumName);
//     const duration = candidate.duration || null;

//     const signatureTrack = normalizeText(signature.trackName);
//     const signatureArtist = normalizeText(signature.artistName);
//     const signatureAlbum = normalizeAlbum(signature.albumName);
//     const signatureDuration = signature.duration || null;

//     let score = 0;
//     if (trackName === signatureTrack) {
//         score += 50;
//     } else if (trackName && signatureTrack && (trackName.includes(signatureTrack) || signatureTrack.includes(trackName))) {
//         score += 25;
//     }

//     if (artistName === signatureArtist) {
//         score += 40;
//     } else if (artistName && signatureArtist && (artistName.includes(signatureArtist) || signatureArtist.includes(artistName))) {
//         score += 20;
//     }

//     if (albumName === signatureAlbum) {
//         score += 25;
//     } else if (albumName && signatureAlbum && (albumName.includes(signatureAlbum) || signatureAlbum.includes(albumName))) {
//         score += 12;
//     }

//     if (duration && signatureDuration) {
//         const diff = Math.abs(duration - signatureDuration);
//         if (diff <= 2) {
//             score += 30;
//         } else if (diff <= 5) {
//             score += 20;
//         } else if (diff <= 10) {
//             score += 10;
//         } else {
//             score -= 20;
//         }
//     }

//     return score;
// };

// const filterCandidates = (candidates, signature) => {
//     log("filterCandidates()")
//     const filtered = candidates
//         .filter((candidate) => candidate && candidate.syncedLyrics && !candidate.instrumental)
//         .filter((candidate) => {
//             if (!signature.duration || !candidate.duration) {
//                 return true;
//             }
//             return Math.abs(candidate.duration - signature.duration) <= 10;
//         })
//         .map((candidate) => ({
//             ...candidate,
//             score: scoreCandidate(candidate, signature)
//         }))
//         .filter((candidate) => candidate.score >= MATCH_SCORE_THRESHOLD)
//         .sort((a, b) => b.score - a.score);

//     return filtered[0] || null;
// };

// const fetchLyricsFromSearch = async (signature, serverSettings) => {
//     log("fetchLyricsFromSearch()")
//     const params = new URLSearchParams({
//         track_name: signature.trackName,
//         artist_name: signature.artistName,
//         album_name: signature.albumName
//     });
//     const results = await fetchJsonWithTiming(`/api/search?${params.toString()}`, serverSettings, "search");
//     if (!Array.isArray(results)) {
//         return null;
//     }
//     return filterCandidates(results, signature);
// };

// /**
//  * Helper to check if the returned result is a valid lyrics file.
//  * We need synced lyrics to show in the UI, "syncedLyrics" is present.
//  * Some tracks are instrumental, "instrumental": true, no need to show lyrics UI.
//  * @param {object} result 
//  * @returns {boolean}
//  */
// const isValidLyrics = (result) => {
//     log("Valid lyrics found!")
//     if (result && result.syncedLyrics && !result.instrumental) {
//         return true;
//     }
//     else {
//         return false
//     }
// }

// const fetchBestLyricsBySignature = async (signature, serverSettings) => {
//     log("fetchBestLyricsBySignature()")
//     const params = new URLSearchParams({
//         track_name: signature.trackName,
//         artist_name: signature.artistName,
//         album_name: signature.albumName,
//         duration: signature.duration
//     });

//     const searchParams = new URLSearchParams({
//         track_name: signature.trackName,
//         artist_name: signature.artistName,
//         album_name: signature.albumName
//     });
//     const results = await Promise.all([
//         fetchJsonWithTiming(`/api/get-cached?${params.toString()}`, serverSettings, "get-cached"),
//         fetchJsonWithTiming(`/api/get?${params.toString()}`, serverSettings, "get"),
//         fetchJsonWithTiming(`/api/search?${searchParams.toString()}`, serverSettings, "search")
//     ].map((promise) => promise.catch(() => null)));

//     const candidates = [];
//     results.forEach((result) => {
//         if (!result) {
//             return;
//         }
//         if (Array.isArray(result)) {
//             candidates.push(...result);
//         } else {
//             candidates.push(result);
//         }
//     });

//     if (!candidates.length) {
//         return null;
//     }
//     return filterCandidates(candidates, signature);
// };

// const setLyricsPrefetchState = (io, payload) => {
//     log("setLyricsPrefetchState()")
//     if (!io) {
//         return;
//     }
//     io.emit("lyrics-prefetch", payload);
//     // log("Lyrics Prefetch:", {
//     //     status: payload?.status,
//     //     reason: payload?.reason,
//     //     mode: payload?.mode,
//     //     trackKey: payload?.trackKey,
//     //     signature: payload?.signature
//     // });
// };

// const findCachedLyricsForSignature = (trackKey, serverSettings) => {
//     log("findCachedLyricsForSignature()")
//     // const baseTrackKey = buildTrackKey(signature);
//     // const offsets = [0, -1, 1, -2, 2];
//     // for (const offset of offsets) {
//     //     const duration = signature.duration + offset;
//     //     const candidateKey = buildTrackKey(signature);
//     //     const cacheLookup = lyricsCache.get(candidateKey);
//     //     if (cacheLookup.status === "hit" && cacheLookup.payload) {
//     //         const payload = {
//     //             ...cacheLookup.payload,
//     //             trackKey: trackKey,
//     //             signature: {
//     //                 ...cacheLookup.payload.signature,
//     //                 duration: signature.duration
//     //             }
//     //         };
//     //         return {
//     //             ...cacheLookup,
//     //             payload,
//     //             status: offset === 0 ? "hit" : "hit-duration-offset",
//     //             lookupTrackKey: candidateKey
//     //         };
//     //     }
//     //     if (cacheLookup.status === "error") {
//     //         log("findCachedLyricsForSignature", "error")
//     //         return cacheLookup;
//     //     }
//     // }
//     return lyricsCache.get(trackKey);
// };

// const matchesAlbum = (candidate, signature) => {
//     log("matchesAlbum()")
//     if (!candidate?.albumName || !signature?.albumName) {
//         return false;
//     }
//     const candidateAlbum = normalizeAlbum(candidate.albumName);
//     const signatureAlbum = normalizeAlbum(signature.albumName);
//     if (!candidateAlbum || !signatureAlbum) {
//         return false;
//     }
//     return candidateAlbum === signatureAlbum
//         || candidateAlbum.includes(signatureAlbum)
//         || signatureAlbum.includes(candidateAlbum);
// };

// const fetchPrefetchCandidates = async (params, serverSettings) => {
//     log("fetchPrefetchCandidates()")
//     const results = await fetchJson(`/api/search?${params.toString()}`, serverSettings);
//     if (!Array.isArray(results)) {
//         return [];
//     }
//     return results
//         .filter((candidate) => candidate && candidate.syncedLyrics && !candidate.instrumental)
//         .slice(0, PREFETCH_BATCH_LIMIT);
// };

// const runWithConcurrency = async (items, limit, handler) => new Promise((resolve) => {
//     log("runWithConcurrency()")
//     const results = [];
//     let index = 0;
//     let active = 0;

//     const next = () => {
//         if (index >= items.length && active === 0) {
//             resolve(results);
//             return;
//         }
//         while (active < limit && index < items.length) {
//             const item = items[index++];
//             active += 1;
//             Promise.resolve(handler(item))
//                 .then((result) => results.push(result))
//                 .catch((error) => results.push({ error }))
//                 .finally(() => {
//                     active -= 1;
//                     next();
//                 });
//         }
//     };

//     next();
// });

// const storeCandidateInCache = (candidate, serverSettings) => {
//     log("storeCandidateInCache()")
//     const signature = {
//         trackName: candidate.trackName,
//         artistName: candidate.artistName,
//         albumName: candidate.albumName,
//         duration: normalizeDurationForKey(candidate.duration)
//     };
//     const trackKey = buildTrackKey(signature);
//     const payload = {
//         status: "ok",
//         // provider: "lrclib",
//         trackKey,
//         signature,
//         id: candidate.id,
//         trackName: candidate.trackName,
//         artistName: candidate.artistName,
//         albumName: candidate.albumName,
//         duration: signature.duration,
//         instrumental: candidate.instrumental,
//         syncedLyrics: candidate.syncedLyrics
//     };
//     const stored = lyricsCache.storeLyrics(payload, serverSettings);
//     return { trackKey, stored: stored.stored, error: stored.error };
// };

// const prefetchCandidates = async (candidates, serverSettings) => {
//     log("prefetchCandidates()")
//     const cacheConfig = getCacheConfig(serverSettings);
//     const limit = cacheConfig.maxPrefetchConcurrency || PREFETCH_CONCURRENCY_FALLBACK;
//     return runWithConcurrency(candidates, limit, async (candidate) => {
//         const signature = {
//             trackName: candidate.trackName,
//             artistName: candidate.artistName,
//             albumName: candidate.albumName,
//             duration: normalizeDurationForKey(candidate.duration)
//         };
//         const trackKey = buildTrackKey(signature);
//         if (lyricsCache.hasCachedLyrics(trackKey, serverSettings)) {
//             return { trackKey, skipped: "cached" };
//         }
//         if (inFlightRequests.has(trackKey)) {
//             return { trackKey, skipped: "in-flight" };
//         }
//         return storeCandidateInCache(candidate, serverSettings);
//     });
// };

// const schedulePrefetchForSignature = (io, signature, serverSettings, options = {}) => {
//     log("schedulePrefetchForSignature()")
//     const cacheConfig = getCacheConfig(serverSettings);
//     if (!cacheConfig.enabled) {
//         return;
//     }
//     const mode = getPrefetchMode(serverSettings);
//     if (mode === PREFETCH_MODES.OFF) {
//         return;
//     }
//     const prefetchKey = `${signature.trackName}|${signature.artistName}|${signature.albumName}|${signature.duration}|${mode}`;
//     if (prefetchInFlight.has(prefetchKey)) {
//         return;
//     }

//     const prefetchPromise = (async () => {
//         const startedAt = Date.now();
//         const albumKey = normalizeAlbum(signature.albumName);
//         const artistKey = normalizeText(signature.artistName);
//         if (lyricsCache.hasAlbumPrefetchComplete(artistKey, albumKey, serverSettings)) {
//             setLyricsPrefetchState(io, {
//                 status: "skipped",
//                 reason: "album-prefetch-complete",
//                 mode,
//                 signature
//             });
//             return;
//         }
//         setLyricsPrefetchState(io, {
//             status: "start",
//             mode,
//             signature,
//             reason: options.reason || "unknown",
//             startedAt
//         });

//         let totalStored = 0;
//         let totalSkipped = 0;
//         let totalCandidates = 0;
//         let skippedInFlight = 0;
//         let skippedCached = 0;
//         let skippedOther = 0;

//         const albumParams = new URLSearchParams({
//             album_name: signature.albumName,
//             artist_name: signature.artistName,
//             q: `${signature.artistName} ${signature.albumName}`
//         });
//         const albumCandidates = mode !== PREFETCH_MODES.OFF
//             ? (await fetchPrefetchCandidates(albumParams, serverSettings))
//                 .filter((candidate) => matchesAlbum(candidate, signature))
//             : [];

//         totalCandidates += albumCandidates.length;
//         const albumResults = await prefetchCandidates(albumCandidates, serverSettings);
//         albumResults.forEach((result) => {
//             if (result?.stored) {
//                 totalStored += 1;
//             } else {
//                 totalSkipped += 1;
//                 if (result?.skipped === "cached") {
//                     skippedCached += 1;
//                 } else if (result?.skipped === "in-flight") {
//                     skippedInFlight += 1;
//                 } else {
//                     skippedOther += 1;
//                     if (result?.error) {
//                         log(`Lyrics prefetch cache skipped (${result.error})`, result.trackKey);
//                     }
//                 }
//             }
//         });

//         const shouldMarkAlbumComplete = totalCandidates > 0
//             && skippedInFlight === 0
//             && skippedOther === 0;
//         if (shouldMarkAlbumComplete) {
//             lyricsCache.markAlbumPrefetchComplete(artistKey, albumKey, serverSettings);
//         }

//         setLyricsPrefetchState(io, {
//             status: "done",
//             mode,
//             signature,
//             reason: options.reason || "unknown",
//             startedAt,
//             totalMs: Date.now() - startedAt,
//             totalCandidates,
//             stored: totalStored,
//             skipped: totalSkipped,
//             skippedCached,
//             skippedInFlight,
//             skippedOther
//         });
//     })().catch((error) => {
//         log("LRCLIB prefetch error:", error.message);
//         setLyricsPrefetchState(io, {
//             status: "error",
//             mode: getPrefetchMode(serverSettings),
//             signature,
//             reason: options.reason || "unknown",
//             error: error.message
//         });
//     }).finally(() => {
//         prefetchInFlight.delete(prefetchKey);
//     });

//     prefetchInFlight.set(prefetchKey, prefetchPromise);
// };

// const prefetchLyricsForMetadata = async (io, metadata, serverSettings, options = {}) => {
//     log("prefetchLyricsForMetadata()")
//     const enabled = serverSettings?.features?.lyrics?.enabled;
//     if (!enabled || !metadata || !metadata.trackMetaData) {
//         setLyricsPrefetchState(io, {
//             status: "skipped",
//             reason: options.reason || (!enabled ? "disabled" : "missing-metadata")
//         });
//         return;
//     }

//     const signature = buildSignatureFromMetadata(metadata);
//     if (!signature) {
//         setLyricsPrefetchState(io, {
//             status: "skipped",
//             reason: "missing-signature"
//         });
//         return;
//     }

//     const trackKey = buildTrackKey(signature);
//     const cached = lyricsCache.get(trackKey);
//     if (cached.status === "hit") {
//         setLyricsPrefetchState(io, {
//             status: "cached",
//             trackKey,
//             signature
//         });
//         return;
//     }

//     try {
//         const startedAt = Date.now();
//         setLyricsPrefetchState(io, {
//             status: "start",
//             trackKey,
//             signature,
//             startedAt
//         });
//         await fetchLyricsForSignature(signature, trackKey, serverSettings, null, {
//             prefetch: {
//                 source: "next-track-metadata",
//                 startedAt
//             }
//         });
//         // schedulePrefetchForSignature(io, signature, serverSettings, {
//         //     reason: "next-track-metadata"
//         // });
//         setLyricsPrefetchState(io, {
//             status: "done",
//             trackKey,
//             signature,
//             startedAt,
//             totalMs: Date.now() - startedAt
//         });
//     } catch (error) {
//         log("LRCLIB prefetch error:", error.message);
//         setLyricsPrefetchState(io, {
//             status: "error",
//             trackKey,
//             signature,
//             error: error.message
//         });
//     }
// };

module.exports = {
    getLyricsForMetadata,
    // prefetchLyricsForMetadata,
    // parseDurationToSeconds,
    // buildTrackKey
};
