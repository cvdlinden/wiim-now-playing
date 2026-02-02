// ===========================================================================
// lyrics.js
//
// Lyrics integration (LRCLIB)

const https = require("https");
const log = require("debug")("lib:lyrics");

const LRCLIB_BASE_URL = "https://lrclib.net";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 10 * 60 * 1000;
const MATCH_SCORE_THRESHOLD = 70;

const cache = new Map();

const normalizeText = (value) => {
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

const normalizeAlbum = (value) => {
    return normalizeText(value)
        .replace(/\b(deluxe|edition|remaster(ed)?|expanded|bonus|anniversary|live|acoustic|mono|stereo|version)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

const parseDurationToSeconds = (duration) => {
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

const buildTrackKey = (trackName, artistName, albumName, duration) => {
    const base = [
        normalizeText(trackName),
        normalizeText(artistName),
        normalizeText(albumName),
        duration || ""
    ].join("|");
    return base;
};

const getUserAgent = (serverSettings) => {
    const version = serverSettings?.version?.server || "unknown";
    return `WiiMNowPlaying/${version} (+https://github.com)`;
};

const fetchJson = (path, serverSettings) => new Promise((resolve, reject) => {
    const url = `${LRCLIB_BASE_URL}${path}`;
    const req = https.get(url, {
        headers: {
            "User-Agent": getUserAgent(serverSettings)
        }
    }, (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            } else if (res.statusCode === 404) {
                resolve(null);
            } else {
                reject(new Error(`LRCLIB request failed with status ${res.statusCode}`));
            }
        });
    });
    req.on("error", reject);
});

const scoreCandidate = (candidate, signature) => {
    const trackName = normalizeText(candidate.trackName);
    const artistName = normalizeText(candidate.artistName);
    const albumName = normalizeAlbum(candidate.albumName);
    const duration = candidate.duration || null;

    const signatureTrack = normalizeText(signature.trackName);
    const signatureArtist = normalizeText(signature.artistName);
    const signatureAlbum = normalizeAlbum(signature.albumName);
    const signatureDuration = signature.duration || null;

    let score = 0;
    if (trackName === signatureTrack) {
        score += 50;
    } else if (trackName && signatureTrack && (trackName.includes(signatureTrack) || signatureTrack.includes(trackName))) {
        score += 25;
    }

    if (artistName === signatureArtist) {
        score += 40;
    } else if (artistName && signatureArtist && (artistName.includes(signatureArtist) || signatureArtist.includes(artistName))) {
        score += 20;
    }

    if (albumName === signatureAlbum) {
        score += 25;
    } else if (albumName && signatureAlbum && (albumName.includes(signatureAlbum) || signatureAlbum.includes(albumName))) {
        score += 12;
    }

    if (duration && signatureDuration) {
        const diff = Math.abs(duration - signatureDuration);
        if (diff <= 2) {
            score += 30;
        } else if (diff <= 5) {
            score += 20;
        } else if (diff <= 10) {
            score += 10;
        } else {
            score -= 20;
        }
    }

    return score;
};

const buildSignatureFromMetadata = (metadata) => {
    const trackName = metadata?.trackMetaData?.["dc:title"] || "";
    const artistName = metadata?.trackMetaData?.["upnp:artist"] || "";
    const albumName = metadata?.trackMetaData?.["upnp:album"] || "";
    const duration = parseDurationToSeconds(metadata?.TrackDuration);

    if (!trackName || !artistName || !albumName || !duration) {
        return null;
    }

    return { trackName, artistName, albumName, duration };
};

const filterCandidates = (candidates, signature) => {
    const filtered = candidates
        .filter((candidate) => candidate && candidate.syncedLyrics && !candidate.instrumental)
        .filter((candidate) => {
            if (!signature.duration || !candidate.duration) {
                return true;
            }
            return Math.abs(candidate.duration - signature.duration) <= 10;
        })
        .map((candidate) => ({
            ...candidate,
            score: scoreCandidate(candidate, signature)
        }))
        .filter((candidate) => candidate.score >= MATCH_SCORE_THRESHOLD)
        .sort((a, b) => b.score - a.score);

    return filtered[0] || null;
};

const fetchLyricsFromSearch = async (signature, serverSettings) => {
    const params = new URLSearchParams({
        track_name: signature.trackName,
        artist_name: signature.artistName,
        album_name: signature.albumName
    });
    const results = await fetchJson(`/api/search?${params.toString()}`, serverSettings);
    if (!Array.isArray(results)) {
        return null;
    }
    return filterCandidates(results, signature);
};

const fetchLyricsBySignature = async (signature, serverSettings) => {
    const params = new URLSearchParams({
        track_name: signature.trackName,
        artist_name: signature.artistName,
        album_name: signature.albumName,
        duration: signature.duration
    });

    const cached = await fetchJson(`/api/get-cached?${params.toString()}`, serverSettings);
    if (cached && cached.syncedLyrics && !cached.instrumental) {
        return cached;
    }

    const direct = await fetchJson(`/api/get?${params.toString()}`, serverSettings);
    if (direct && direct.syncedLyrics && !direct.instrumental) {
        return direct;
    }

    return fetchLyricsFromSearch(signature, serverSettings);
};

const setLyricsState = (io, deviceInfo, payload) => {
    deviceInfo.lyrics = payload;
    io.emit("lyrics", payload);
};

const clearLyrics = (io, deviceInfo, reason, signature, trackKey) => {
    if (deviceInfo.lyrics && deviceInfo.lyrics.trackKey === trackKey && deviceInfo.lyrics.status === reason) {
        return;
    }
    setLyricsState(io, deviceInfo, {
        status: reason,
        trackKey: trackKey || null,
        signature: signature || null
    });
};

const getLyricsForMetadata = async (io, deviceInfo, serverSettings) => {
    const enabled = serverSettings?.features?.lyrics?.enabled;
    if (!enabled) {
        clearLyrics(io, deviceInfo, "disabled");
        return;
    }

    const metadata = deviceInfo.metadata;
    if (!metadata || !metadata.trackMetaData) {
        clearLyrics(io, deviceInfo, "no-metadata");
        return;
    }

    const trackSource = (metadata.TrackSource || "").toLowerCase();
    if (trackSource !== "tidal") {
        clearLyrics(io, deviceInfo, "not-supported-source");
        return;
    }

    const signature = buildSignatureFromMetadata(metadata);
    if (!signature) {
        clearLyrics(io, deviceInfo, "missing-signature");
        return;
    }

    const trackKey = buildTrackKey(signature.trackName, signature.artistName, signature.albumName, signature.duration);
    if (deviceInfo.lyrics && deviceInfo.lyrics.trackKey === trackKey && deviceInfo.lyrics.status === "ok") {
        return;
    }

    const cached = cache.get(trackKey);
    if (cached && cached.expiresAt > Date.now()) {
        setLyricsState(io, deviceInfo, cached.payload);
        return;
    }

    try {
        const lyrics = await fetchLyricsBySignature(signature, serverSettings);
        if (lyrics && lyrics.syncedLyrics) {
            const payload = {
                status: "ok",
                provider: "lrclib",
                trackKey,
                signature,
                id: lyrics.id,
                trackName: lyrics.trackName,
                artistName: lyrics.artistName,
                albumName: lyrics.albumName,
                duration: lyrics.duration,
                instrumental: lyrics.instrumental,
                syncedLyrics: lyrics.syncedLyrics
            };
            cache.set(trackKey, {
                payload,
                expiresAt: Date.now() + CACHE_TTL_MS
            });
            setLyricsState(io, deviceInfo, payload);
            return;
        }

        const payload = {
            status: "not-found",
            provider: "lrclib",
            trackKey,
            signature
        };
        cache.set(trackKey, {
            payload,
            expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS
        });
        setLyricsState(io, deviceInfo, payload);
    } catch (error) {
        log("LRCLIB error:", error.message);
        clearLyrics(io, deviceInfo, "error", signature, trackKey);
    }
};

module.exports = {
    getLyricsForMetadata,
    parseDurationToSeconds,
    buildTrackKey
};
