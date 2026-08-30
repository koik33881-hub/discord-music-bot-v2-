const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'finish',
  /**
   * @param {import('distube').Queue} queue
   */
  async execute(queue) {
    if (!queue.textChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(config.embedColor || '#00d2ff')
        .setTitle('🏁 Antrean Musik Selesai')
        .setDescription('Seluruh antrean lagu telah selesai diputar.')
        .setTimestamp();

      await queue.textChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error in finish event:', error);
    }
  },
};
