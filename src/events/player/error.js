const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

/**
 * Filter out sensitive paths or tokens from error text
 */
function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return 'Terjadi kesalahan pemutaran audio.';
  return msg
    .replace(/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{27,}/g, '[REDACTED_TOKEN]')
    .replace(/[A-Z]:\\[^\s]+/gi, '[PATH]')
    .slice(0, 1000);
}

module.exports = {
  name: 'error',
  /**
   * @param {Error} error
   * @param {import('distube').Queue} [queue]
   * @param {import('distube').Song} [song]
   */
  async execute(error, queue, song) {
    console.error('[DisTube Player Error]:', error?.message || error);
    const textChannel = queue?.textChannel;
    if (!textChannel) return;

    try {
      const cleanMessage = sanitizeErrorMessage(error?.message || String(error));
      const embed = new EmbedBuilder()
        .setColor(config.errorColor || '#FF4444')
        .setTitle('⚠️ Terjadi Masalah Audio')
        .setDescription(`\`\`\`\n${cleanMessage}\n\`\`\``)
        .setFooter({ text: 'Jika lagu gagal dimuat, coba cari dengan kata kunci lain atau gunakan link alternatif.' })
        .setTimestamp();

      await textChannel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {
      console.error('[Error Event] Error sending error embed:', err.message);
    }
  },
};
