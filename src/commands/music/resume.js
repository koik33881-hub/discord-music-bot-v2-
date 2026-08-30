const { SlashCommandBuilder } = require('discord.js');
const { createPlayerEmbed } = require('../../utils/playerEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Lanjutkan (resume) lagu yang sedang dijeda'),
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

    if (!queue.paused) {
      return interaction.reply({
        content: '⚠️ Pemutaran musik sedang berjalan, tidak dalam keadaan dijeda!',
        ephemeral: true,
      });
    }

    try {
      queue.resume();

      // Sync active player embed
      if (queue.metadata?.playerMessage) {
        const payload = createPlayerEmbed(queue, queue.songs[0], false);
        if (payload) {
          queue.metadata.playerMessage.edit(payload).catch((err) =>
            console.debug('[ResumeCommand] PlayerMessage sync notice:', err.message)
          );
        }
      }

      return interaction.reply({
        content: '▶️ Musik berhasil dilanjutkan!',
      });
    } catch (error) {
      console.error('[ResumeCommand] Error:', error.message);
      return interaction.reply({
        content: `❌ Gagal melanjutkan musik: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
