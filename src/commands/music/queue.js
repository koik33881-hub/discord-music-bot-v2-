const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Tampilkan daftar antrean musik yang sedang berjalan'),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('distube').DisTube} distube
   */
  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs || queue.songs.length === 0) {
      return interaction.reply({
        content: '📜 Antrean musik saat ini kosong!',
        ephemeral: true,
      });
    }

    const pageSize = 10;
    const totalPages = Math.ceil(queue.songs.length / pageSize) || 1;
    let currentPage = 0;

    const generateEmbed = (page) => {
      const start = page * pageSize;
      const end = start + pageSize;
      const songsOnPage = queue.songs.slice(start, end);

      let desc = `**Sedang Diputar:**\n[${queue.songs[0].name}](${queue.songs[0].url}) - \`${queue.songs[0].formattedDuration}\` (oleh: <@${queue.songs[0].user?.id || 'Unknown'}>)\n\n`;

      if (queue.songs.length > 1) {
        desc += `**Antrean Selanjutnya:**\n`;
        songsOnPage.forEach((song, i) => {
          const index = start + i;
          if (index === 0) return; // Skip 0 as it's currently playing
          desc += `\`${index}.\` [${song.name}](${song.url}) - \`${song.formattedDuration}\` (oleh <@${song.user?.id || 'Unknown'}>)\n`;
        });
      } else {
        desc += `*Tidak ada lagu berikutnya di antrean.*`;
      }

      return new EmbedBuilder()
        .setColor(config.embedColor || '#00BFFF')
        .setTitle(`📜 Antrean Musik - ${interaction.guild.name}`)
        .setDescription(desc.slice(0, 4000))
        .setFooter({
          text: `Halaman ${page + 1}/${totalPages} • Total: ${queue.songs.length} lagu • Durasi: ${queue.formattedDuration}`,
        })
        .setTimestamp();
    };

    const getButtons = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('queue_prev')
          .setLabel('◀️ Sebelumnya')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('queue_next')
          .setLabel('Selanjutnya ▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page >= totalPages - 1)
      );
    };

    const response = await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: totalPages > 1 ? [getButtons(currentPage)] : [],
      fetchReply: true,
    });

    if (totalPages <= 1) return;

    const collector = response.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000,
    });

    collector.on('collect', async (i) => {
      try {
        if (i.customId === 'queue_prev' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'queue_next' && currentPage < totalPages - 1) {
          currentPage++;
        }

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [getButtons(currentPage)],
        });
      } catch (err) {
        console.error('[QueueCollector] Error updating page:', err.message);
      }
    });

    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (err) {
        // Message might have been deleted by user or channel cleared
        console.debug('[QueueCollector] Collector ended, message cleanup notice:', err.message);
      }
    });
  },
};
