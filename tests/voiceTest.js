require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.on('ready', async () => {
  console.log('Bot ready as', client.user.tag);
  const guild = client.guilds.cache.first();
  if (!guild) {
    console.log('No guild found');
    process.exit(1);
  }
  const vc = guild.channels.cache.find((c) => c.isVoiceBased());
  if (!vc) {
    console.log('No VC found in guild', guild.name);
    process.exit(1);
  }
  console.log('Found voice channel:', vc.name, 'in guild:', guild.name);

  const connection = joinVoiceChannel({
    channelId: vc.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  connection.on('stateChange', (oldState, newState) => {
    console.log(`[Voice State Transition]: ${oldState.status} -> ${newState.status}`);
    if (newState.status === VoiceConnectionStatus.Ready) {
      console.log('🎉 VOICE CONNECTION IS READY!');
      setTimeout(() => {
        connection.destroy();
        client.destroy();
        process.exit(0);
      }, 3000);
    }
  });

  connection.on('error', (err) => {
    console.error('[Voice Error]:', err);
  });
});

client.login(process.env.DISCORD_TOKEN);
