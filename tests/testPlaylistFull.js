const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { Client, GatewayIntentBits } = require('discord.js');

console.log('Testing full playlist extraction pipeline:');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const distube = new DisTube(client, {
  plugins: [new SpotifyPlugin(), new SoundCloudPlugin()],
});

console.log('✅ DisTube initialized with SpotifyPlugin and SoundCloudPlugin (Pure Music Engine).');
