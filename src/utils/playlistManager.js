const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const DATA_FILE = path.join(__dirname, '../../data/playlists.json');
const MAX_PLAYLISTS_PER_GUILD = config.maxPlaylistsPerGuild || 50;
const MAX_SONGS_PER_PLAYLIST = config.maxSongsPerPlaylist || 100;
const MAX_NAME_LENGTH = 50;

// In-memory cache
let cachedData = null;

/**
 * Load all playlists from storage safely
 */
function loadData() {
  if (cachedData) return cachedData;

  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { guilds: {} };
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      cachedData = initial;
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.guilds) {
      cachedData = { guilds: {} };
    } else {
      cachedData = parsed;
    }
    return cachedData;
  } catch (error) {
    console.error('[PlaylistManager] Error loading playlists, fallback to empty:', error.message);
    cachedData = { guilds: {} };
    return cachedData;
  }
}

/**
 * Safe write to disk
 */
function saveData(data) {
  cachedData = data;

  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Direct synchronous write avoids Windows EPERM rename file locking
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[PlaylistManager] Error saving data:', error.message);
    return false;
  }
}

/**
 * Sanitize strings to avoid injection or corrupted rendering
 */
function sanitizeString(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

/**
 * Validate playlist name
 */
function validatePlaylistName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Nama playlist tidak boleh kosong.' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
    return { valid: false, reason: `Panjang nama playlist harus antara 1 dan ${MAX_NAME_LENGTH} karakter.` };
  }
  // Allow letters, numbers, spaces, dashes, underscores, common punctuation
  const validRegex = /^[\w\s\-.,!?#()]+$/u;
  if (!validRegex.test(trimmed)) {
    return { valid: false, reason: 'Nama playlist mengandung karakter yang tidak didukung.' };
  }
  return { valid: true, name: trimmed };
}

/**
 * Get all playlists for a guild
 */
function getPlaylists(guildId) {
  if (!guildId) return {};
  const data = loadData();
  return data.guilds[guildId] || {};
}

/**
 * Get a specific playlist by name for a guild
 */
function getPlaylist(guildId, name) {
  if (!guildId || !name) return null;
  const playlists = getPlaylists(guildId);
  const key = name.toLowerCase().trim();
  return playlists[key] || null;
}

/**
 * Save or overwrite a playlist
 */
function savePlaylist(guildId, userId, name, songs) {
  if (!guildId) throw new Error('Guild ID tidak valid.');

  const validation = validatePlaylistName(name);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const data = loadData();
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {};
  }

  const currentCount = Object.keys(data.guilds[guildId]).length;
  const key = validation.name.toLowerCase();

  // If new playlist and reached limit
  if (!data.guilds[guildId][key] && currentCount >= MAX_PLAYLISTS_PER_GUILD) {
    throw new Error(`Batas maksimal playlist tercapai (${MAX_PLAYLISTS_PER_GUILD} playlist per server).`);
  }

  const safeSongs = (Array.isArray(songs) ? songs : [])
    .slice(0, MAX_SONGS_PER_PLAYLIST)
    .map((s) => ({
      name: sanitizeString(s?.name || s?.url || 'Unknown Track', 150),
      url: sanitizeString(s?.url || '', 500),
      formattedDuration: sanitizeString(s?.formattedDuration || 'Unknown', 20),
      uploader: sanitizeString(s?.uploader?.name || s?.uploader || 'Unknown', 100),
    }));

  data.guilds[guildId][key] = {
    name: validation.name,
    createdBy: sanitizeString(userId, 30),
    createdAt: new Date().toISOString(),
    songs: safeSongs,
  };

  saveData(data);
  return data.guilds[guildId][key];
}

/**
 * Add a single song or URL to a saved playlist
 */
function addSongToPlaylist(guildId, name, song) {
  if (!guildId || !name || !song) return null;

  const data = loadData();
  const key = name.toLowerCase().trim();
  if (!data.guilds[guildId] || !data.guilds[guildId][key]) {
    return null;
  }

  const playlist = data.guilds[guildId][key];
  if (playlist.songs.length >= MAX_SONGS_PER_PLAYLIST) {
    throw new Error(`Playlist telah mencapai batas maksimal (${MAX_SONGS_PER_PLAYLIST} lagu).`);
  }

  playlist.songs.push({
    name: sanitizeString(song.name || song.url || 'Unknown Track', 150),
    url: sanitizeString(song.url || '', 500),
    formattedDuration: sanitizeString(song.formattedDuration || 'Unknown', 20),
    uploader: sanitizeString(song.uploader?.name || song.uploader || 'Unknown', 100),
  });

  saveData(data);
  return playlist;
}

/**
 * Delete a playlist
 */
function deletePlaylist(guildId, name) {
  if (!guildId || !name) return false;

  const data = loadData();
  const key = name.toLowerCase().trim();
  if (!data.guilds[guildId] || !data.guilds[guildId][key]) {
    return false;
  }

  delete data.guilds[guildId][key];
  saveData(data);
  return true;
}

/**
 * Reset cache (useful for tests)
 */
function _resetCache() {
  cachedData = null;
}

module.exports = {
  getPlaylists,
  getPlaylist,
  savePlaylist,
  addSongToPlaylist,
  deletePlaylist,
  validatePlaylistName,
  sanitizeString,
  _resetCache,
};
