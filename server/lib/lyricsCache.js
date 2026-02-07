// ===========================================================================
// lyricsCache.js
//
// Persistent lyrics cache (SQLite)

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { DatabaseSync } = require("node:sqlite");
const log = require("debug")("lib:lyrics-cache");

const DEFAULT_CACHE_PATH = process.env.LYRICS_CACHE_PATH
    || "/var/lib/wiim-now-playing/lyrics-cache.sqlite";
const BROTLI_OPTIONS = {
    params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 65536
    }
};

let db = null;
let statements = null;
let dbError = null;

const getCacheConfig = (serverSettings) => {
    const cacheSettings = serverSettings?.features?.lyrics?.cache || {};
    const maxSizeMB = typeof cacheSettings.maxSizeMB === "number" ? cacheSettings.maxSizeMB : 0;
    const enabled = cacheSettings.enabled !== false && maxSizeMB > 0;

    return {
        enabled,
        maxSizeBytes: Math.max(0, Math.round(maxSizeMB * 1024 * 1024)),
        maxPrefetchConcurrency: typeof cacheSettings.maxPrefetchConcurrency === "number"
            ? cacheSettings.maxPrefetchConcurrency
            : 4,
        prefetch: cacheSettings.prefetch || "off",
        path: cacheSettings.path || DEFAULT_CACHE_PATH
    };
};

const ensureDb = (cachePath) => {
    if (db) {
        return true;
    }
    if (dbError) {
        return false;
    }
    const directory = path.dirname(cachePath);
    try {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        db = new DatabaseSync(cachePath);
        db.exec("PRAGMA journal_mode = WAL;");
        db.exec("PRAGMA synchronous = NORMAL;");

        db.exec(`
            CREATE TABLE IF NOT EXISTS lyrics_cache (
                trackKey TEXT PRIMARY KEY,
                trackName TEXT,
                artistName TEXT,
                albumName TEXT,
                duration INTEGER,
                provider TEXT,
                lrclibId INTEGER,
                instrumental INTEGER,
                syncedLyrics BLOB,
                syncedLyricsSize INTEGER,
                fetchedAt INTEGER,
                lastAccessedAt INTEGER
            );
            CREATE INDEX IF NOT EXISTS idx_lyrics_cache_last_accessed
                ON lyrics_cache (lastAccessedAt ASC);

            CREATE TABLE IF NOT EXISTS lyrics_album_prefetch (
                artistKey TEXT,
                albumKey TEXT,
                completedAt INTEGER,
                PRIMARY KEY (artistKey, albumKey)
            );
        `);

        statements = {
            getByKey: db.prepare("SELECT * FROM lyrics_cache WHERE trackKey = ?"),
            hasKey: db.prepare("SELECT 1 FROM lyrics_cache WHERE trackKey = ?"),
            hasAlbumPrefetch: db.prepare(
                "SELECT 1 FROM lyrics_album_prefetch WHERE artistKey = ? AND albumKey = ?"
            ),
            markAlbumPrefetch: db.prepare(`
                INSERT OR REPLACE INTO lyrics_album_prefetch (
                    artistKey,
                    albumKey,
                    completedAt
                ) VALUES (?, ?, ?)
            `),
            insert: db.prepare(`
                INSERT OR REPLACE INTO lyrics_cache (
                    trackKey,
                    trackName,
                    artistName,
                    albumName,
                    duration,
                    provider,
                    lrclibId,
                    instrumental,
                    syncedLyrics,
                    syncedLyricsSize,
                    fetchedAt,
                    lastAccessedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `),
            touch: db.prepare("UPDATE lyrics_cache SET lastAccessedAt = ? WHERE trackKey = ?"),
            totalSize: db.prepare("SELECT COALESCE(SUM(syncedLyricsSize), 0) AS totalSize FROM lyrics_cache"),
            count: db.prepare("SELECT COUNT(1) AS totalCount FROM lyrics_cache"),
            oldest: db.prepare("SELECT trackKey, syncedLyricsSize FROM lyrics_cache ORDER BY lastAccessedAt ASC LIMIT ?"),
            deleteByKey: db.prepare("DELETE FROM lyrics_cache WHERE trackKey = ?")
        };

        log("Cache database ready:", cachePath);
        return true;
    } catch (error) {
        dbError = error;
        log("Cache database error:", error.message);
        db = null;
        statements = null;
        return false;
    }
};

const compressLyrics = (text) => {
    if (!text) {
        return { buffer: null, size: 0 };
    }
    const buffer = zlib.brotliCompressSync(Buffer.from(text, "utf8"), BROTLI_OPTIONS);
    return { buffer, size: buffer.length };
};

const decompressLyrics = (buffer) => {
    if (!buffer) {
        return "";
    }
    return zlib.brotliDecompressSync(buffer).toString("utf8");
};

const getCacheStats = (cacheConfig) => {
    if (!cacheConfig.enabled) {
        return { totalSize: 0, totalCount: 0 };
    }
    if (!ensureDb(cacheConfig.path)) {
        return { totalSize: 0, totalCount: 0 };
    }
    return {
        totalSize: statements.totalSize.get().totalSize || 0,
        totalCount: statements.count.get().totalCount || 0
    };
};

const getCachedLyrics = (trackKey, serverSettings) => {
    const cacheConfig = getCacheConfig(serverSettings);
    const startedAt = Date.now();
    if (!cacheConfig.enabled) {
        return { status: "disabled", durationMs: Date.now() - startedAt, cacheConfig };
    }
    if (!ensureDb(cacheConfig.path)) {
        return { status: "error", durationMs: Date.now() - startedAt, cacheConfig };
    }

    const row = statements.getByKey.get(trackKey);
    const durationMs = Date.now() - startedAt;
    if (!row) {
        return { status: "miss", durationMs, cacheConfig };
    }

    const now = Date.now();
    statements.touch.run(now, trackKey);

    let syncedLyrics = "";
    try {
        syncedLyrics = decompressLyrics(row.syncedLyrics);
    } catch (error) {
        log("Failed to decompress cached lyrics", error.message);
        statements.deleteByKey.run(trackKey);
        return { status: "corrupt", durationMs, cacheConfig };
    }

    const payload = {
        status: "ok",
        provider: row.provider || "lrclib",
        trackKey: row.trackKey,
        signature: {
            trackName: row.trackName,
            artistName: row.artistName,
            albumName: row.albumName,
            duration: row.duration
        },
        id: row.lrclibId,
        trackName: row.trackName,
        artistName: row.artistName,
        albumName: row.albumName,
        duration: row.duration,
        instrumental: Boolean(row.instrumental),
        syncedLyrics
    };

    return { status: "hit", durationMs, payload, cacheConfig };
};

const hasCachedLyrics = (trackKey, serverSettings) => {
    const cacheConfig = getCacheConfig(serverSettings);
    if (!cacheConfig.enabled) {
        return false;
    }
    if (!ensureDb(cacheConfig.path)) {
        return false;
    }
    return Boolean(statements.hasKey.get(trackKey));
};

const pruneCache = (cacheConfig) => {
    if (!cacheConfig.enabled) {
        return { removed: 0, totalSize: 0 };
    }
    if (!ensureDb(cacheConfig.path)) {
        return { removed: 0, totalSize: 0 };
    }

    let totalSize = statements.totalSize.get().totalSize || 0;
    if (totalSize <= cacheConfig.maxSizeBytes) {
        return { removed: 0, totalSize };
    }

    let removed = 0;
    const deleteBatch = statements.oldest.all(25);
    for (const row of deleteBatch) {
        if (totalSize <= cacheConfig.maxSizeBytes) {
            break;
        }
        statements.deleteByKey.run(row.trackKey);
        totalSize -= row.syncedLyricsSize || 0;
        removed += 1;
    }

    if (totalSize > cacheConfig.maxSizeBytes) {
        const followUp = pruneCache(cacheConfig);
        return {
            removed: removed + followUp.removed,
            totalSize: followUp.totalSize
        };
    }

    return { removed, totalSize };
};

const storeLyrics = (payload, serverSettings) => {
    const cacheConfig = getCacheConfig(serverSettings);
    if (!cacheConfig.enabled || !payload || payload.status !== "ok" || !payload.syncedLyrics) {
        return { stored: false, cacheConfig };
    }
    if (!ensureDb(cacheConfig.path)) {
        return { stored: false, cacheConfig, error: "db-unavailable" };
    }

    try {
        const { buffer, size } = compressLyrics(payload.syncedLyrics);
        const now = Date.now();

        statements.insert.run(
            payload.trackKey,
            payload.trackName,
            payload.artistName,
            payload.albumName,
            payload.duration,
            payload.provider || "lrclib",
            payload.id || null,
            payload.instrumental ? 1 : 0,
            buffer,
            size,
            now,
            now
        );

        const inserted = Boolean(statements.hasKey.get(payload.trackKey));
        if (!inserted) {
            return { stored: false, cacheConfig, error: "verify-failed" };
        }

        const pruneResult = pruneCache(cacheConfig);
        return {
            stored: true,
            cacheConfig,
            size,
            pruned: pruneResult.removed,
            totalSize: pruneResult.totalSize
        };
    } catch (error) {
        log("Cache insert error:", error.message);
        return { stored: false, cacheConfig, error: error.message };
    }
};

const closeCache = () => {
    if (!db) {
        return;
    }
    try {
        db.close();
        log("Cache database closed");
    } catch (error) {
        log("Cache database close error:", error.message);
    } finally {
        db = null;
        statements = null;
    }
};

const hasAlbumPrefetchComplete = (artistKey, albumKey, serverSettings) => {
    const cacheConfig = getCacheConfig(serverSettings);
    if (!cacheConfig.enabled) {
        return false;
    }
    if (!ensureDb(cacheConfig.path)) {
        return false;
    }
    return Boolean(statements.hasAlbumPrefetch.get(artistKey, albumKey));
};

const markAlbumPrefetchComplete = (artistKey, albumKey, serverSettings) => {
    const cacheConfig = getCacheConfig(serverSettings);
    if (!cacheConfig.enabled) {
        return false;
    }
    if (!ensureDb(cacheConfig.path)) {
        return false;
    }
    const now = Date.now();
    statements.markAlbumPrefetch.run(artistKey, albumKey, now);
    return true;
};

module.exports = {
    getCacheConfig,
    getCacheStats,
    getCachedLyrics,
    hasCachedLyrics,
    storeLyrics,
    pruneCache,
    closeCache,
    hasAlbumPrefetchComplete,
    markAlbumPrefetchComplete
};
