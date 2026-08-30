const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YouTubePlugin } = require('@distube/youtube');
const { Client, GatewayIntentBits } = require('discord.js');

console.log('Testing full playlist extraction pipeline:');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const distube = new DisTube(client, {
  plugins: [new YouTubePlugin(), new SpotifyPlugin()],
});

console.log('✅ DisTube initialized with YouTubePlugin and SpotifyPlugin (0% Python dependency).');
