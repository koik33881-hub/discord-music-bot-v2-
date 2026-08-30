require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('raw', (packet) => {
  if (packet.t === 'VOICE_STATE_UPDATE' || packet.t === 'VOICE_SERVER_UPDATE') {
    console.log(`[RAW GATEWAY PACKET ${packet.t}]:`, JSON.stringify(packet.d));
  }
});

client.on('ready', () => {
  console.log('Ready as', client.user.tag);
  const guild = client.guilds.cache.first();
  const vc = guild.channels.cache.find((c) => c.isVoiceBased());
  console.log('VC:', vc.name, 'ID:', vc.id);

  const conn = joinVoiceChannel({
    channelId: vc.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });

  conn.on('stateChange', (o, n) => {
    console.log(`State: ${o.status} -> ${n.status}`);
  });
});

client.login(process.env.DISCORD_TOKEN);
