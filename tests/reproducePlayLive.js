require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { initPlayer } = require('../src/client/player');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const distube = initPlayer(client);

// Track all events
distube.on('playSong', (queue, song) => {
  console.log('🎵 [EVENT playSong]:', song.name, `(${song.formattedDuration})`);
  console.log('   Stream URL / Source:', song.url, 'Source:', song.source);
  console.log('   Audio Player State:', queue.voice.audioPlayer?.state?.status);
});

distube.on('addList', (queue, playlist) => {
  console.log('📑 [EVENT addList]:', playlist.name, 'with', playlist.songs.length, 'songs');
});

distube.on('addSong', (queue, song) => {
  console.log('➕ [EVENT addSong]:', song.name);
});

distube.on('error', (channel, error) => {
  console.error('❌ [EVENT distube error]:', error);
});

distube.on('ffmpegDebug', (debug) => {
  console.log('🔧 [FFMPEG DEBUG]:', debug);
});

client.on('ready', async () => {
  console.log('🤖 Bot ready as:', client.user.tag);
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.error('❌ No guild found');
    process.exit(1);
  }

  console.log('🏰 Guild:', guild.name, `(${guild.id})`);
  const vc = guild.channels.cache.find((c) => c.isVoiceBased());
  if (!vc) {
    console.error('❌ No voice channel found');
    process.exit(1);
  }

  const textChannel = guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages'));

  console.log('🔊 Target Voice Channel:', vc.name, `(${vc.id})`);
  console.log('💬 Target Text Channel:', textChannel?.name);

  const playlistUrl = 'https://open.spotify.com/playlist/1omI5rfHqRbM7Ks4YKoaBk?si=43596778e71645a1';
  console.log('\n🚀 ATTEMPTING distube.play FOR PLAYLIST:', playlistUrl);

  try {
    await distube.play(vc, playlistUrl, {
      textChannel: textChannel,
    });
    console.log('✅ distube.play call returned successfully! Monitoring playback stream...');
  } catch (err) {
    console.error('❌ distube.play threw error:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
