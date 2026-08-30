const { ActivityType, REST, Routes } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  /**
   * @param {import('discord.js').Client} client
   */
  async execute(client) {
    console.log(`\n========================================`);
    console.log(`🤖 Logged in as ${client.user.tag}!`);
    console.log(`🌐 Connected to ${client.guilds.cache.size} servers`);
    console.log(`========================================\n`);

    // Set bot activity presence
    client.user.setPresence({
      activities: [
        {
          name: '/play | Multi-Source Music',
          type: ActivityType.Listening,
        },
      ],
      status: 'online',
    });

    // Register Slash Commands
    const commands = [];
    client.commands.forEach((command) => {
      commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
      console.log(`🔄 Started refreshing ${commands.length} application (/) commands...`);

      if (process.env.GUILD_ID) {
        // Instant registration for test server
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
          { body: commands }
        );
        console.log(`✅ Successfully reloaded application (/) commands for guild: ${process.env.GUILD_ID}`);
      } else {
        // Global registration
        await rest.put(Routes.applicationCommands(client.user.id), {
          body: commands,
        });
        console.log(`✅ Successfully reloaded ${commands.length} application (/) commands globally.`);
      }
    } catch (error) {
      console.error('❌ Error registering slash commands:', error);
    }
  },
};
