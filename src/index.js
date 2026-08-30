require('dotenv').config();
const { InstanceLock } = require('./utils/instanceLock');

// 0. Anti-Collision Guard: Ensure single instance per machine
InstanceLock.acquire();

// Optional Guard: Disable local bot if Railway/Cloud is the designated host
if (process.env.DISABLE_LOCAL_BOT === 'true' && !process.env.RAILWAY_ENVIRONMENT) {
  console.log('\n🔒 [Environment Guard] Local bot is DISABLED via DISABLE_LOCAL_BOT=true.');
  console.log('   The bot is designated to run exclusively on Railway (Cloud).');
  console.log('   Exiting to prevent session collisions.\n');
  process.exit(0);
}

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initPlayer } = require('./client/player');

// Check token
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_bot_token_here') {
  console.error('\n❌ ERROR: Token Discord belum diisi!');
  console.error('👉 Buka file .env dan isi DISCORD_TOKEN dengan token bot Anda dari Discord Developer Portal.\n');
  process.exit(1);
}

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// 1. Initialize DisTube Music Player
client.distube = initPlayer(client);

// 2. Load Commands Recursively
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  const commandFolders = fs.readdirSync(commandsPath);
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
      const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));
      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          console.log(`[Command Loaded] /${command.data.name} (${folder})`);
        } else {
          console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    }
  }
}

// 3. Load Client Events
const clientEventsPath = path.join(__dirname, 'events', 'client');
if (fs.existsSync(clientEventsPath)) {
  const clientEventFiles = fs.readdirSync(clientEventsPath).filter((file) => file.endsWith('.js'));
  for (const file of clientEventFiles) {
    const filePath = path.join(clientEventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[Client Event Loaded] ${event.name}`);
  }
}

// 4. Load DisTube Player Events
const playerEventsPath = path.join(__dirname, 'events', 'player');
if (fs.existsSync(playerEventsPath)) {
  const playerEventFiles = fs.readdirSync(playerEventsPath).filter((file) => file.endsWith('.js'));
  for (const file of playerEventFiles) {
    const filePath = path.join(playerEventsPath, file);
    const event = require(filePath);
    client.distube.on(event.name, (...args) => event.execute(...args));
    console.log(`[Player Event Loaded] ${event.name}`);
  }
}

// 5. Global Error Handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

// 6. Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    if (client.distube && client.distube.voices) {
      client.distube.voices.collection.forEach((voice) => {
        voice.leave();
      });
    }
    client.destroy();
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// 7. Login to Discord
client.login(process.env.DISCORD_TOKEN);
