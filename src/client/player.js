const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { DeezerPlugin } = require('@distube/deezer');
const { DirectLinkPlugin } = require('@distube/direct-link');
const ffmpegStatic = require('ffmpeg-static');

/**
 * Initializes and configures the DisTube music player instance (DisTube v5 compatible)
 * Pure, reliable audio streaming via Spotify, SoundCloud, Deezer, and Direct Links.
 * @param {import('discord.js').Client} client
 * @returns {DisTube}
 */
function initPlayer(client) {
  const spotifyOptions = {};
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    spotifyOptions.api = {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    };
  }

  const plugins = [
    new SpotifyPlugin(spotifyOptions),
    new SoundCloudPlugin(),
    new DeezerPlugin(),
    new DirectLinkPlugin(),
  ];

  const distube = new DisTube(client, {
    plugins: plugins,
    emitNewSongOnly: true,
    savePreviousSongs: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    joinNewVoiceChannel: false,
    ffmpeg: {
      path: ffmpegStatic,
    },
  });

  return distube;
}

module.exports = { initPlayer };
