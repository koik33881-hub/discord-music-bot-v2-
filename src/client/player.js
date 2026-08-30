const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { DeezerPlugin } = require('@distube/deezer');
const { DirectLinkPlugin } = require('@distube/direct-link');
const ffmpegStatic = require('ffmpeg-static');

/**
 * Initializes and configures the DisTube music player instance (DisTube v5 compatible)
 * Pure JavaScript Audio Engine (Zero Python dependency)
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
    new YouTubePlugin(),
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
