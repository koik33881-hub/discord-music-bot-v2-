const { SlashCommandBuilder } = require('discord.js');
const { createPlayerEmbed } = require('../../utils/playerEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Tampilkan controller dan informasi lagu yang sedang diputar'),
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

    const payload = createPlayerEmbed(queue, queue.songs[0]);
    if (!payload) {
      return interaction.reply({
        content: '❌ Gagal memuat info pemutar!',
        ephemeral: true,
      });
    }

    return interaction.reply(payload);
  },
};
