// ===========================================================================
// lyricsCache.js

/**
 * Lyrics caching module.
 * Creates and maintains a cache in memory, using LRU.
 * Unstorage could possibly do filestorage in future releases.
 * The amount stored is fine for memory (kb's)
 * @module
 */

// Other modules
const { createStorage } = require("unstorage");
const lru = require("unstorage/drivers/lru-cache");
const log = require("debug")("lib:lyrics-cache");

/**
 * Initializes memory storage cache
 */
const storage = createStorage({
    driver: lru({
        max: 1000, // Max 1000 JSON objects in RAM
        ttl: 1000 * 60 * 60 * 8 // Keep cached items for 8 hours
    })
});

/**
 * Get an item from cache
 * @param {string} key 
 * @returns {Promise<object|null>}
 */
async function get(key) {
    const value = await storage.getItem(key);
    log("GET:", value ? "HIT [" + value.status + "]" : "MISS", key);
    return value;
}

/**
 * Store an item to cache
 * @param {string} key 
 * @param {object} val 
 */
async function set(key, val) {
    log("SET:", `[${val?.status}]`, key);
    await storage.setItem(key, val);
}

/**
 * Check whether the item is cache
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
async function has(key) {
    const exists = await storage.hasItem(key);
    log("HAS:", `[${exists}]`, key);
    return exists;
}

/**
 * Removes an item from cache
 * @param {string} key 
 */
async function remove(key) {
    log("REMOVE:", key)
    await storage.removeItem(key, { removeMeta: true })
}

/**
 * Count the number of items in cache
 * @returns {Promise<number>}
 */
async function count() {
    const keys = await storage.getKeys();
    log("COUNT:", keys.length);
    return keys.length;
}

module.exports = {
    get,
    set,
    has,
    remove,
    count
};
