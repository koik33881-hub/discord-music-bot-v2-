const { SlashCommandBuilder } = require('discord.js');
const { createPlayerEmbed } = require('../../utils/playerEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Jeda (pause) lagu yang sedang diputar'),
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

    if (queue.paused) {
      return interaction.reply({
        content: '⚠️ Pemutaran musik sudah dalam keadaan dijeda (paused)!',
        ephemeral: true,
      });
    }

    try {
      queue.pause();

      // Sync active player embed
      if (queue.metadata?.playerMessage) {
        const payload = createPlayerEmbed(queue, queue.songs[0], true);
        if (payload) {
          queue.metadata.playerMessage.edit(payload).catch((err) =>
            console.debug('[PauseCommand] PlayerMessage sync notice:', err.message)
          );
        }
      }

      return interaction.reply({
        content: '⏸️ Musik berhasil dijeda! Gunakan `/resume` atau tombol RESUME untuk melanjutkan.',
      });
    } catch (error) {
      console.error('[PauseCommand] Error:', error.message);
      return interaction.reply({
        content: `❌ Gagal menjeda musik: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
