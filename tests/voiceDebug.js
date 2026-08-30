require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.on('ready', async () => {
  console.log('Testing voice connection for:', client.user.tag);
  const guild = client.guilds.cache.first();
  const vc = guild.channels.cache.find((c) => c.isVoiceBased());
  console.log('VC:', vc.name);

  const connection = joinVoiceChannel({
    channelId: vc.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  connection.on('stateChange', (oldState, newState) => {
    console.log(`[State]: ${oldState.status} -> ${newState.status}`);
  });

  connection.on('error', (err) => {
    console.error('[Error]:', err);
  });
});

client.login(process.env.DISCORD_TOKEN);
