require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let session_id = null;

client.on('raw', (packet) => {
  if (packet.t === 'VOICE_STATE_UPDATE' && packet.d.user_id === client.user.id) {
    session_id = packet.d.session_id;
    console.log('[DEBUG] Session ID obtained:', session_id);
  }
  if (packet.t === 'VOICE_SERVER_UPDATE') {
    const { token, guild_id, endpoint } = packet.d;
    console.log('[DEBUG] Voice Server Endpoint:', endpoint, 'Token:', token?.slice(0, 10) + '...');

    const wsUrl = `wss://${endpoint}/?v=4`;
    console.log('[DEBUG] Connecting Voice WS to:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('✅ Voice WS Connected! Sending Opcode 0 Identify...');
      ws.send(
        JSON.stringify({
          op: 0,
          d: {
            server_id: guild_id,
            user_id: client.user.id,
            session_id: session_id,
            token: token,
          },
        })
      );
    });

    ws.on('message', (data) => {
      const parsed = JSON.parse(data.toString());
      console.log('📩 Voice WS Received Opcode:', parsed.op, 'Data:', JSON.stringify(parsed.d).slice(0, 200));
    });

    ws.on('close', (code, reason) => {
      console.log(`❌ Voice WS Closed! Code: ${code}, Reason: "${reason.toString()}"`);
    });

    ws.on('error', (err) => {
      console.error('❌ Voice WS Error:', err.message);
    });
  }
});

client.on('ready', () => {
  console.log('Logged in as:', client.user.tag);
  const guild = client.guilds.cache.first();
  const vc = guild.channels.cache.find((c) => c.isVoiceBased());
  console.log('Sending voice state update for VC:', vc.name);

  // Send raw gateway voice state update
  guild.shard.send({
    op: 4,
    d: {
      guild_id: guild.id,
      channel_id: vc.id,
      self_mute: false,
      self_deaf: true,
    },
  });
});

client.login(process.env.DISCORD_TOKEN);
