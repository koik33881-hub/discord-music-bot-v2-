const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Putar kembali lagu sebelumnya yang ada di riwayat antrean'),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('distube').DisTube} distube
   */
  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({
        content: '❌ Tidak ada musik yang sedang diputar!',
        ephemeral: true,
      });
    }

    if (!queue.previousSongs || queue.previousSongs.length === 0) {
      return interaction.reply({
        content: '⏮️ Tidak ada lagu sebelumnya dalam riwayat pemutaran!',
        ephemeral: true,
      });
    }

    try {
      await queue.previous();
      return interaction.reply({
        content: '⏮️ Memutar kembali lagu sebelumnya!',
      });
    } catch (error) {
      return interaction.reply({
        content: `❌ Gagal memutar lagu sebelumnya: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
