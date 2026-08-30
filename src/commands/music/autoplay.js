const { SlashCommandBuilder } = require('discord.js');
const { createPlayerEmbed } = require('../../utils/playerEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoplay')
    .setDescription('Nyalakan atau matikan mode putar otomatis lagu serupa'),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('distube').DisTube} distube
   */
  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs || queue.songs.length === 0) {
      return interaction.reply({
        content: '❌ Tidak ada musik yang sedang diputar!',
        ephemeral: true,
      });
    }

    try {
      const autoplay = queue.toggleAutoplay();

      // Sync active player embed
      if (queue.metadata?.playerMessage) {
        const payload = createPlayerEmbed(queue, queue.songs[0]);
        if (payload) {
          queue.metadata.playerMessage.edit(payload).catch((err) =>
            console.debug('[AutoplayCommand] PlayerMessage sync notice:', err.message)
          );
        }
      }

      return interaction.reply({
        content: `📻 Autoplay saat ini: **${autoplay ? 'Aktif (ON)' : 'Mati (OFF)'}**!`,
      });
    } catch (error) {
      console.error('[AutoplayCommand] Error:', error.message);
      return interaction.reply({
        content: `❌ Gagal mengubah autoplay: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
