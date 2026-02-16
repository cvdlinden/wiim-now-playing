// ===========================================================================
// lyricsCache.test.js 
//
// Unit tests for the lyricsCache.js module.
// Uses Jest as the testing framework.
// ===========================================================================

const cache = require('../lib/lyricsCache.js');

describe('Lyrics Cache Module', () => {

    // We gebruiken unieke keys per test om vervuiling te voorkomen
    const testKey = 'artist:title';
    const testData = { status: 'success', lyrics: 'Lorum Ipsum...' };

    test('should store and retrieve an item', async () => {
        // Arrange & Act
        await cache.set(testKey, testData);
        const result = await cache.get(testKey);

        // Assert
        expect(result).toEqual(testData);
        expect(result.status).toBe('success');
    });

    test('should return null for non-existing keys', async () => {
        // Act
        const result = await cache.get('non-existent');

        // Assert
        expect(result).toBeNull();
    });

    test('should correctly check for existence with has()', async () => {
        // Arrange
        await cache.set('exists-key', { status: 'ok' });

        // Act
        const exists = await cache.has('exists-key');
        const missing = await cache.has('missing-key');

        // Assert
        expect(exists).toBe(true);
        expect(missing).toBe(false);
    });

    test('should count the number of items correctly', async () => {
        // Arrange - we gaan ervan uit dat de cache leeg is of we tellen erbij op
        const initialCount = await cache.count();
        await cache.set('new-item', { status: 'ok' });

        // Act
        const newCount = await cache.count();

        // Assert
        expect(newCount).toBe(initialCount + 1);
    });

    test("moet een item correct verwijderen uit de cache", async () => {
        const removeKey = "delete-me-key";
        await cache.set(removeKey, { data: "test" });

        // Bevestig dat het er eerst in staat
        expect(await cache.has(removeKey)).toBe(true);

        // Act
        await cache.remove(removeKey);

        // Assert
        const exists = await cache.has(removeKey);
        const data = await cache.get(removeKey);

        expect(exists).toBe(false);
        expect(data).toBeNull();
    });

    test("moet niet crashen als de key niet bestaat bij verwijderen", async () => {
        await expect(cache.remove("non-existent-key-123")).resolves.not.toThrow();
    });
});
