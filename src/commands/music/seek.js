const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Lompat ke durasi tertentu dalam lagu (dalam detik)')
    .addIntegerOption((option) =>
      option
        .setName('seconds')
        .setDescription('Posisi waktu dalam detik (contoh: 60 untuk menit ke-1)')
        .setRequired(true)
        .setMinValue(0)
    ),
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

    const currentSong = queue.songs[0];
    if (currentSong.isLive || currentSong.duration === 0) {
      return interaction.reply({
        content: '❌ Tidak dapat melakukan seek pada siaran langsung (Live Stream)!',
        ephemeral: true,
      });
    }

    const seconds = interaction.options.getInteger('seconds');
    const songDuration = currentSong.duration || 0;

    if (seconds > songDuration) {
      return interaction.reply({
        content: `❌ Durasi melebihi panjang lagu (${songDuration} detik)!`,
        ephemeral: true,
      });
    }

    try {
      await queue.seek(seconds);
      return interaction.reply({
        content: `⏩ Posisi lagu dipindahkan ke detik ke-**${seconds}**!`,
      });
    } catch (error) {
      console.error('[SeekCommand] Error:', error.message);
      return interaction.reply({
        content: `❌ Gagal memindahkan durasi lagu: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
