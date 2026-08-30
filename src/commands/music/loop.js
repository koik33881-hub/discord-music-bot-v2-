const { SlashCommandBuilder } = require('discord.js');
const { createPlayerEmbed } = require('../../utils/playerEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Ubah mode pengulangan musik')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Pilih mode perulangan')
        .setRequired(true)
        .addChoices(
          { name: 'Mati (Off)', value: '0' },
          { name: 'Ulang Lagu Ini (Song)', value: '1' },
          { name: 'Ulang Seluruh Antrean (Queue)', value: '2' }
        )
    ),
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

    const mode = parseInt(interaction.options.getString('mode'), 10);

    try {
      queue.setRepeatMode(mode);

      // Sync active player embed
      if (queue.metadata?.playerMessage) {
        const payload = createPlayerEmbed(queue, queue.songs[0]);
        if (payload) {
          queue.metadata.playerMessage.edit(payload).catch((err) =>
            console.debug('[LoopCommand] PlayerMessage sync notice:', err.message)
          );
        }
      }

      const modeNames = ['Mati (Off)', 'Ulang Lagu Saat Ini (Song)', 'Ulang Seluruh Antrean (Queue)'];
      return interaction.reply({
        content: `🔁 Mode perulangan diubah menjadi: **${modeNames[mode]}**!`,
      });
    } catch (error) {
      console.error('[LoopCommand] Error:', error.message);
      return interaction.reply({
        content: `❌ Gagal mengubah mode perulangan: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
