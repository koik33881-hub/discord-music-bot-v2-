const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  name: 'addList',
  /**
   * @param {import('distube').Queue} queue
   * @param {import('distube').Playlist} playlist
   */
  async execute(queue, playlist) {
    if (!queue.textChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(config.embedColor || '#00d2ff')
        .setAuthor({ name: 'Playlist Ditambahkan ke Antrean', iconURL: 'https://cdn.discordapp.com/emojis/858607185038311444.webp' })
        .setDescription(`📑 **[${playlist.name}](${playlist.url || ''})**`)
        .addFields(
          { name: '🎶 Total Lagu', value: `${playlist.songs.length} lagu`, inline: true },
          { name: '⏱️ Total Durasi', value: `${playlist.formattedDuration}`, inline: true }
        )
        .setFooter({ text: `Diminta oleh ${playlist.user?.tag || playlist.user?.username}` })
        .setTimestamp();

      if (playlist.thumbnail) {
        embed.setThumbnail(playlist.thumbnail);
      }

      await queue.textChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error in addList event:', error);
    }
  },
};
