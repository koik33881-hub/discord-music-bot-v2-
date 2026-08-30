const { handlePlayerButtons } = require('../../components/playerButtons');
const { CooldownManager } = require('../../utils/cooldownManager');
const config = require('../../../config.json');

// Memory-safe command cooldown manager
const commandCooldowns = new CooldownManager(config.commandCooldownMs || 1500);

module.exports = {
  name: 'interactionCreate',
  /**
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    try {
      // 1. Handle Slash Commands
      if (interaction.isChatInputCommand()) {
        const userId = interaction.user.id;
        const cooldownKey = `cmd_${interaction.commandName}_${userId}`;
        const cooldownCheck = commandCooldowns.check(cooldownKey);

        if (cooldownCheck.onCooldown) {
          return interaction.reply({
            content: '⏳ Harap tunggu sebentar sebelum menjalankan perintah ini lagi.',
            ephemeral: true,
          });
        }

        const command = client.commands.get(interaction.commandName);
        if (!command) {
          return interaction.reply({
            content: '❌ Perintah tidak ditemukan!',
            ephemeral: true,
          });
        }

        console.log(`[Command Executed] /${interaction.commandName} by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);

        try {
          await command.execute(interaction, client.distube);
        } catch (error) {
          console.error(`[Command Error] /${interaction.commandName}:`, error);
          const replyPayload = {
            content: `❌ Terjadi kesalahan saat menjalankan perintah: ${error.message || 'Kesalahan tidak diketahui'}`,
            ephemeral: true,
          };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyPayload).catch((e) => console.error('Failed followUp:', e.message));
          } else {
            await interaction.reply(replyPayload).catch((e) => console.error('Failed reply:', e.message));
          }
        }
        return;
      }

      // 2. Handle Autocomplete
      if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;

        try {
          await command.autocomplete(interaction, client.distube);
        } catch (error) {
          console.error(`[Autocomplete Error] /${interaction.commandName}:`, error.message);
        }
        return;
      }

      // 3. Handle Button Interactions
      if (interaction.isButton()) {
        if (interaction.customId.startsWith('player_')) {
          await handlePlayerButtons(interaction, client.distube);
        }
      }
    } catch (globalError) {
      console.error('[InteractionCreate Global Error]:', globalError);
    }
  },
};
