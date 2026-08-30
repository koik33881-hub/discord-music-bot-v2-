const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek status latensi bot dan koneksi WebSocket'),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Mengukur latensi...',
      fetchReply: true,
    });

    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsPing = interaction.client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(config.embedColor || '#00d2ff')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 Latensi Pesan', value: `\`${roundtrip}ms\``, inline: true },
        { name: '💓 Latensi WebSocket', value: `\`${wsPing}ms\``, inline: true }
      )
      .setTimestamp();

    return interaction.editReply({ content: null, embeds: [embed] });
  },
};
