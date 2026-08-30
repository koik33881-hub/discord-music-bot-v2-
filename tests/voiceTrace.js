require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.on('ready', () => {
  const guild = client.guilds.cache.first();
  const voiceChannel = guild.channels.cache.find((c) => c.isVoiceBased());
  console.log('Connecting to:', voiceChannel.name, 'in guild:', guild.name);

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  connection.on('stateChange', (oldState, newState) => {
    console.log(`[State]: ${oldState.status} -> ${newState.status}`);
    if (newState.networking) {
      newState.networking.on('debug', (d) => console.log(`[Networking Debug]:`, d));
      newState.networking.on('error', (e) => console.error(`[Networking Error]:`, e));
      if (newState.networking.state.ws) {
        newState.networking.state.ws.on('message', (m) => console.log(`[WS Packet]:`, m));
      }
    }
  });

  connection.on('error', (err) => console.error(`[Conn Error]:`, err));
});

client.login(process.env.DISCORD_TOKEN);
