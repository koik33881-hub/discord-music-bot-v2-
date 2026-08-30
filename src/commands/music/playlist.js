const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const {
  getPlaylists,
  getPlaylist,
  savePlaylist,
  addSongToPlaylist,
  deletePlaylist,
} = require('../../utils/playlistManager');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Kelola dan putar custom playlist server')
    // Subcommand: play
    .addSubcommand((sub) =>
      sub
        .setName('play')
        .setDescription('Putar seluruh lagu dari custom playlist yang tersimpan')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Nama playlist yang ingin diputar')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    // Subcommand: save
    .addSubcommand((sub) =>
      sub
        .setName('save')
        .setDescription('Simpan antrean lagu yang sedang aktif menjadi playlist baru')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Nama playlist baru')
            .setRequired(true)
            .setMaxLength(50)
        )
    )
    // Subcommand: add
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Tambahkan lagu/link ke dalam playlist yang sudah tersimpan')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Nama playlist')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt
            .setName('song')
            .setDescription('Judul lagu atau URL yang ingin ditambahkan')
            .setRequired(true)
            .setMaxLength(500)
        )
    )
    // Subcommand: list
    .addSubcommand((sub) =>
      sub
        .setName('list')
        .setDescription('Lihat seluruh daftar custom playlist yang ada di server ini')
    )
    // Subcommand: view
    .addSubcommand((sub) =>
      sub
        .setName('view')
        .setDescription('Lihat daftar lagu di dalam custom playlist tertentu')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Nama playlist yang ingin dilihat')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    // Subcommand: delete
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Hapus custom playlist yang tersimpan')
        .addStringOption((opt) =>
          opt
            .setName('name')
            .setDescription('Nama playlist yang ingin dihapus')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  /**
   * Autocomplete handler for playlist names
   */
  async autocomplete(interaction) {
    if (!interaction.guildId) return;

    try {
      const focusedValue = (interaction.options.getFocused() || '').toLowerCase();
      const playlists = getPlaylists(interaction.guildId);
      const names = Object.values(playlists || {})
        .map((p) => p?.name || '')
        .filter(Boolean);

      const filtered = names
        .filter((choice) => choice.toLowerCase().includes(focusedValue))
        .slice(0, 25);

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } catch (error) {
      console.error('[PlaylistAutocomplete] Error:', error.message);
    }
  },

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('distube').DisTube} distube
   */
  async execute(interaction, distube) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.reply({
        content: '❌ Perintah ini hanya dapat dijalankan di dalam server Discord!',
        ephemeral: true,
      });
    }

    switch (subcommand) {
      case 'save': {
        const queue = distube.getQueue(guildId);
        if (!queue || !queue.songs || queue.songs.length === 0) {
          return interaction.reply({
            content: '❌ Tidak ada antrean musik yang sedang berjalan untuk disimpan!',
            ephemeral: true,
          });
        }

        const name = interaction.options.getString('name')?.trim();
        const existing = getPlaylist(guildId, name);
        if (existing) {
          return interaction.reply({
            content: `⚠️ Playlist dengan nama **${existing.name}** sudah ada! Harap gunakan nama lain atau hapus yang lama.`,
            ephemeral: true,
          });
        }

        try {
          const saved = savePlaylist(guildId, interaction.user.id, name, queue.songs);
          const embed = new EmbedBuilder()
            .setColor(config.successColor || '#00C851')
            .setTitle('💾 Playlist Berhasil Disimpan!')
            .setDescription(`Playlist **${saved.name}** telah dibuat dengan **${saved.songs.length} lagu**.`)
            .setFooter({ text: 'Gunakan /playlist play untuk memutarnya kapan saja' })
            .setTimestamp();

          return interaction.reply({ embeds: [embed] });
        } catch (error) {
          return interaction.reply({
            content: `❌ Gagal menyimpan playlist: ${error.message}`,
            ephemeral: true,
          });
        }
      }

      case 'play': {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            content: '❌ Anda harus berada di Voice Channel terlebih dahulu!',
            ephemeral: true,
          });
        }

        const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
          return interaction.reply({
            content: '❌ Bot tidak memiliki izin untuk **Connect** atau **Speak** di Voice Channel Anda!',
            ephemeral: true,
          });
        }

        const name = interaction.options.getString('name')?.trim();
        const playlist = getPlaylist(guildId, name);

        if (!playlist || !Array.isArray(playlist.songs) || playlist.songs.length === 0) {
          return interaction.reply({
            content: `❌ Custom playlist **${name}** tidak ditemukan atau tidak memiliki lagu!`,
            ephemeral: true,
          });
        }

        await interaction.deferReply();

        let queuedCount = 0;
        let failCount = 0;

        for (const song of playlist.songs) {
          try {
            await distube.play(voiceChannel, song.url || song.name, {
              textChannel: interaction.channel,
              member: interaction.member,
            });
            queuedCount++;
          } catch (err) {
            console.error(`[PlaylistPlay] Failed to queue song "${song.name}":`, err.message);
            failCount++;
          }
        }

        if (queuedCount === 0) {
          return interaction.editReply({
            content: `❌ Tidak ada lagu dari playlist **${playlist.name}** yang berhasil diputar.`,
          });
        }

        const embed = new EmbedBuilder()
          .setColor(config.embedColor || '#00BFFF')
          .setTitle(`📑 Memutar Playlist: ${playlist.name}`)
          .setDescription(
            `Memasukkan **${queuedCount} lagu** ke dalam antrean.` +
            (failCount > 0 ? `\n⚠️ *${failCount} lagu gagal dimuat.*` : '')
          )
          .setFooter({ text: `Dibuat oleh <@${playlist.createdBy}>` })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      case 'add': {
        const name = interaction.options.getString('name')?.trim();
        const songQuery = interaction.options.getString('song')?.trim();
        const playlist = getPlaylist(guildId, name);

        if (!playlist) {
          return interaction.reply({
            content: `❌ Playlist **${name}** tidak ditemukan!`,
            ephemeral: true,
          });
        }

        if (!songQuery) {
          return interaction.reply({
            content: '❌ Judul lagu atau link tidak boleh kosong!',
            ephemeral: true,
          });
        }

        try {
          addSongToPlaylist(guildId, name, {
            name: songQuery,
            url: songQuery,
            formattedDuration: 'Unknown',
            uploader: 'Custom',
          });

          return interaction.reply({
            content: `✅ Lagu/Link \`${songQuery.slice(0, 80)}\` berhasil ditambahkan ke playlist **${playlist.name}**!`,
          });
        } catch (error) {
          return interaction.reply({
            content: `❌ Gagal menambahkan lagu: ${error.message}`,
            ephemeral: true,
          });
        }
      }

      case 'list': {
        const playlists = getPlaylists(guildId);
        const list = Object.values(playlists || {});

        if (list.length === 0) {
          return interaction.reply({
            content: '📂 Belum ada custom playlist yang tersimpan di server ini. Gunakan `/playlist save <nama>` untuk membuatnya!',
            ephemeral: true,
          });
        }

        let desc = '';
        list.forEach((p, index) => {
          desc += `\`${index + 1}.\` **${p.name}** — ${p.songs?.length || 0} lagu (Dibuat oleh: <@${p.createdBy}>)\n`;
        });

        const embed = new EmbedBuilder()
          .setColor(config.embedColor || '#00BFFF')
          .setTitle(`📂 Daftar Custom Playlist - ${interaction.guild.name}`)
          .setDescription(desc.slice(0, 4000))
          .setFooter({ text: 'Putar dengan /playlist play <nama>' })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case 'view': {
        const name = interaction.options.getString('name')?.trim();
        const playlist = getPlaylist(guildId, name);

        if (!playlist) {
          return interaction.reply({
            content: `❌ Playlist **${name}** tidak ditemukan!`,
            ephemeral: true,
          });
        }

        if (!playlist.songs || playlist.songs.length === 0) {
          return interaction.reply({
            content: `📂 Playlist **${playlist.name}** masih kosong!`,
            ephemeral: true,
          });
        }

        let desc = `**Daftar Lagu di Playlist:**\n\n`;
        playlist.songs.slice(0, 15).forEach((s, idx) => {
          desc += `\`${idx + 1}.\` **[${s.name}](${s.url || 'https://discord.com'})** - \`${s.formattedDuration || 'Unknown'}\`\n`;
        });

        if (playlist.songs.length > 15) {
          desc += `\n*...dan ${playlist.songs.length - 15} lagu lainnya.*`;
        }

        const embed = new EmbedBuilder()
          .setColor(config.embedColor || '#00BFFF')
          .setTitle(`📑 Playlist: ${playlist.name}`)
          .setDescription(desc)
          .setFooter({
            text: `Total: ${playlist.songs.length} lagu • Dibuat oleh user: ${playlist.createdBy}`,
          })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      case 'delete': {
        const name = interaction.options.getString('name')?.trim();
        const success = deletePlaylist(guildId, name);

        if (!success) {
          return interaction.reply({
            content: `❌ Playlist **${name}** tidak ditemukan!`,
            ephemeral: true,
          });
        }

        return interaction.reply({
          content: `🗑️ Playlist **${name}** berhasil dihapus!`,
        });
      }

      default:
        return interaction.reply({
          content: '❌ Subcommand tidak valid.',
          ephemeral: true,
        });
    }
  },
};
