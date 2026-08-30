const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'empty',
  /**
   * @param {import('distube').Queue} queue
   */
  async execute(queue) {
    if (!queue) return;

    // Check 24/7 setting
    if (config.stayInVoice247 || config.leaveOnEmpty === false) {
      return;
    }

    try {
      if (queue.voice) {
        queue.voice.leave();
      }

      if (queue.textChannel) {
        const embed = new EmbedBuilder()
          .setColor(config.errorColor || '#FF4444')
          .setTitle('🚪 Voice Channel Kosong')
          .setDescription('Bot meninggalkan voice channel karena tidak ada pengguna yang tersisa.')
          .setTimestamp();

        await queue.textChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('[Empty Event] Error:', error.message);
    }
  },
};
