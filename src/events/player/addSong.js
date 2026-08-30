const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'addSong',
  /**
   * @param {import('distube').Queue} queue
   * @param {import('distube').Song} song
   */
  async execute(queue, song) {
    if (!queue.textChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(config.embedColor || '#00d2ff')
        .setAuthor({ name: 'Ditambahkan ke Antrean', iconURL: 'https://cdn.discordapp.com/emojis/858607185038311444.webp' })
        .setDescription(`🎵 **[${song.name}](${song.url})**`)
        .addFields(
          { name: '👤 Penyanyi / Channel', value: song.uploader?.name || song.uploader || 'Unknown', inline: true },
          { name: '⏱️ Durasi', value: song.formattedDuration || 'Live', inline: true },
          { name: '🔢 Posisi Antrean', value: `#${queue.songs.length}`, inline: true }
        )
        .setFooter({ text: `Diminta oleh ${song.user?.tag || song.user?.username}` })
        .setTimestamp();

      if (song.thumbnail) {
        embed.setThumbnail(song.thumbnail);
      }

      await queue.textChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error in addSong event:', error);
    }
  },
};
