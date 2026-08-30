const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Hentikan pemutaran musik dan bersihkan antrean'),
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

    queue.stop();
    const embed = new EmbedBuilder()
      .setColor(config.errorColor || '#FF4444')
      .setTitle('⏹️ Pemutaran Dihentikan')
      .setDescription(`Musik dihentikan oleh <@${interaction.user.id}> dan antrean dibersihkan.`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
