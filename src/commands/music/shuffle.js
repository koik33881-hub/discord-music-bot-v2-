const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Acak urutan lagu yang ada di dalam antrean'),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('distube').DisTube} distube
   */
  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs || queue.songs.length <= 1) {
      return interaction.reply({
        content: '❌ Butuh setidaknya 2 lagu di dalam antrean untuk mengacak!',
        ephemeral: true,
      });
    }

    await queue.shuffle();
    return interaction.reply({
      content: '🔀 Antrean lagu berhasil diacak!',
    });
  },
};
