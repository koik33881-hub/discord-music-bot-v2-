const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'disconnect',
  /**
   * @param {import('distube').Queue} queue
   */
  async execute(queue) {
    if (!queue.textChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(config.errorColor || '#FF4444')
        .setTitle('🔌 Terputus dari Voice Channel')
        .setDescription('Bot telah keluar dari voice channel.')
        .setTimestamp();

      await queue.textChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error in disconnect event:', error);
    }
  },
};
