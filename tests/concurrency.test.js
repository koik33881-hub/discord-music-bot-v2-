const test = require('node:test');
const assert = require('node:assert');
const {
  savePlaylist,
  getPlaylist,
  deletePlaylist,
  _resetCache,
} = require('../src/utils/playlistManager');

test('Concurrency & Multi-Guild Isolation Tests', async (t) => {
  t.beforeEach(() => {
    _resetCache();
  });

  await t.test('Multiple guilds can create playlists concurrently without collision', async () => {
    const guildCount = 10;
    const promises = [];

    for (let i = 1; i <= guildCount; i++) {
      const guildId = `concurrent_guild_${i}`;
      const songList = [
        { name: `Song G${i} 1`, url: `https://example.com/g${i}/1` },
        { name: `Song G${i} 2`, url: `https://example.com/g${i}/2` },
      ];
      promises.push(
        Promise.resolve().then(() => savePlaylist(guildId, `user_${i}`, 'Party Playlist', songList))
      );
    }

    await Promise.all(promises);

    // Verify each guild has its own distinct playlist
    for (let i = 1; i <= guildCount; i++) {
      const guildId = `concurrent_guild_${i}`;
      const pl = getPlaylist(guildId, 'Party Playlist');
      assert.ok(pl, `Guild ${guildId} playlist must exist`);
      assert.strictEqual(pl.songs[0].name, `Song G${i} 1`);
      // Cleanup
      deletePlaylist(guildId, 'Party Playlist');
    }
  });
});
