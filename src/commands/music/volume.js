const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Atur volume musik (1 - 100%)')
    .addIntegerOption((option) =>
      option
        .setName('percent')
        .setDescription('Persentase volume (1 - 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
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

    const rawVolume = interaction.options.getInteger('percent');
    const volume = Math.min(100, Math.max(1, rawVolume));

    try {
      queue.setVolume(volume);
      return interaction.reply({
        content: `🔊 Volume musik berhasil diubah menjadi **${volume}%**!`,
      });
    } catch (error) {
      console.error('[VolumeCommand] Error:', error.message);
      return interaction.reply({
        content: `❌ Gagal mengubah volume: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
