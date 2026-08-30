const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const {
  getPlaylists,
  getPlaylist,
  savePlaylist,
  addSongToPlaylist,
  deletePlaylist,
  validatePlaylistName,
  sanitizeString,
  _resetCache,
} = require('../src/utils/playlistManager');

test('PlaylistManager - Unit & Integration Tests', async (t) => {
  const testGuildId = 'test_guild_99999';

  t.beforeEach(() => {
    _resetCache();
  });

  t.after(() => {
    deletePlaylist(testGuildId, 'test_playlist');
    deletePlaylist(testGuildId, 'my hits');
    deletePlaylist(testGuildId, 'rock');
  });

  await t.test('validatePlaylistName works correctly', () => {
    assert.strictEqual(validatePlaylistName('').valid, false);
    assert.strictEqual(validatePlaylistName('   ').valid, false);
    assert.strictEqual(validatePlaylistName('a'.repeat(60)).valid, false);
    assert.strictEqual(validatePlaylistName('My Favorite 2026!').valid, true);
  });

  await t.test('sanitizeString strips excessive length and handles non-strings', () => {
    assert.strictEqual(sanitizeString(123), '');
    assert.strictEqual(sanitizeString('   hello   '), 'hello');
    assert.strictEqual(sanitizeString('a'.repeat(200), 50).length, 50);
  });

  await t.test('savePlaylist creates and returns structured playlist', () => {
    const songs = [
      { name: 'Song 1', url: 'https://youtube.com/watch?v=1', formattedDuration: '03:45', uploader: 'Artist 1' },
      { name: 'Song 2', url: 'https://spotify.com/track/2', formattedDuration: '04:20', uploader: { name: 'Artist 2' } },
    ];

    const result = savePlaylist(testGuildId, 'user_123', 'My Hits', songs);
    assert.strictEqual(result.name, 'My Hits');
    assert.strictEqual(result.songs.length, 2);
    assert.strictEqual(result.songs[0].name, 'Song 1');
    assert.strictEqual(result.songs[1].uploader, 'Artist 2');
  });

  await t.test('getPlaylist fetches case-insensitively', () => {
    const pl = getPlaylist(testGuildId, 'my hits');
    assert.ok(pl);
    assert.strictEqual(pl.name, 'My Hits');
  });

  await t.test('addSongToPlaylist adds a new track', () => {
    const updated = addSongToPlaylist(testGuildId, 'my hits', {
      name: 'Song 3',
      url: 'https://soundcloud.com/track/3',
      formattedDuration: '02:30',
      uploader: 'Artist 3',
    });

    assert.ok(updated);
    assert.strictEqual(updated.songs.length, 3);
  });

  await t.test('deletePlaylist removes the playlist', () => {
    const success = deletePlaylist(testGuildId, 'my hits');
    assert.strictEqual(success, true);
    assert.strictEqual(getPlaylist(testGuildId, 'my hits'), null);
  });
});
