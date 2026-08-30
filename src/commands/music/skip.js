const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Lewati lagu yang sedang diputar ke lagu berikutnya'),
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

    try {
      if (queue.songs.length <= 1 && !queue.autoplay) {
        queue.stop();
        return interaction.reply({
          content: '⏭️ Melewati lagu terakhir. Antrean selesai!',
        });
      }
      await queue.skip();
      return interaction.reply({
        content: '⏭️ Lagu berhasil dilewati!',
      });
    } catch (error) {
      return interaction.reply({
        content: `❌ Gagal melewati lagu: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
