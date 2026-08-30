const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'noRelated',
  /**
   * @param {import('distube').Queue} queue
   */
  async execute(queue) {
    if (!queue.textChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(config.errorColor || '#FF4444')
        .setTitle('📻 Autoplay: Tidak Menemukan Lagu Terkait')
        .setDescription('Bot tidak dapat menemukan rekomendasi lagu serupa untuk diputar.')
        .setTimestamp();

      await queue.textChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('[NoRelated Event] Error sending message:', error.message);
    }
  },
};
