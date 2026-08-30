const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar musik dari link Spotify (Track / Album / Playlist) atau judul lagu')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Judul lagu atau URL Spotify (Track / Album / Playlist)')
        .setRequired(true)
        .setMaxLength(500)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('distube').DisTube} distube
   */
  async execute(interaction, distube) {
    const rawQuery = interaction.options.getString('query');
    const query = rawQuery?.trim();

    if (!query || query.length === 0) {
      return interaction.reply({
        content: '❌ Harap masukkan judul lagu atau link URL yang valid!',
        ephemeral: true,
      });
    }

    // Check if query is a non-Spotify URL
    const isUrl = /^https?:\/\//i.test(query);
    const isSpotify = /^(https?:\/\/)?(open\.)?spotify\.com/i.test(query) || /^spotify:/i.test(query);

    if (isUrl && !isSpotify) {
      return interaction.reply({
        content: '⚠️ Saat ini pemutaran link hanya mendukung **Spotify** (Lagu / Album / Playlist)!\nSilakan gunakan link dari Spotify (contoh: `https://open.spotify.com/track/...` atau `https://open.spotify.com/playlist/...`).',
        ephemeral: true,
      });
    }

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ Anda harus berada di dalam Voice Channel terlebih dahulu!',
        ephemeral: true,
      });
    }

    const me = interaction.guild.members.me;
    const permissions = voiceChannel.permissionsFor(me);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({
        content: '❌ Bot tidak memiliki izin untuk **Connect** atau **Speak** di Voice Channel Anda!',
        ephemeral: true,
      });
    }

    // Check if channel is full and bot cannot bypass
    if (
      voiceChannel.full &&
      !permissions.has(PermissionsBitField.Flags.Administrator) &&
      !permissions.has(PermissionsBitField.Flags.MoveMembers) &&
      voiceChannel.id !== me.voice?.channelId
    ) {
      return interaction.reply({
        content: '❌ Voice Channel tersebut sudah penuh!',
        ephemeral: true,
      });
    }

    const botVoiceChannel = me.voice?.channel;
    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: `❌ Bot sudah terhubung di voice channel lain: **${botVoiceChannel.name}**!`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      await distube.play(voiceChannel, query, {
        textChannel: interaction.channel,
        member: interaction.member,
      });

      const replyEmbed = new EmbedBuilder()
        .setColor(config.embedColor || '#00BFFF')
        .setDescription(`🔍 **Mencari dan memproses:** \`${query.length > 100 ? query.slice(0, 97) + '...' : query}\``)
        .setFooter({ text: `Requested by ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [replyEmbed] });
    } catch (error) {
      console.error('[PlayCommand] Error:', error.message);
      await interaction.editReply({
        content: `❌ Gagal memutar musik: ${error.message || 'Sumber tidak dapat diakses'}`,
      });
    }
  },
};
