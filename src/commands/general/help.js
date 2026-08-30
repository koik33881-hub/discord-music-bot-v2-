const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan panduan perintah dan fitur bot musik'),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor || '#00d2ff')
      .setTitle('📖 Panduan & Perintah Bot Musik')
      .setDescription('Bot musik Discord modern dengan kontrol interaktif dan dukungan multi-sumber (Spotify, YouTube, SoundCloud, Deezer, Apple Music).')
      .addFields(
        {
          name: '🎵 Perintah Musik Utama',
          value:
            '• `/play <judul / url>` : Putar lagu atau playlist dari link/pencarian\n' +
            '• `/pause` : Jeda pemutaran lagu saat ini\n' +
            '• `/resume` : Lanjutkan pemutaran lagu\n' +
            '• `/skip` : Lewati lagu saat ini\n' +
            '• `/previous` : Putar kembali lagu sebelumnya\n' +
            '• `/stop` : Hentikan musik dan bersihkan antrean\n' +
            '• `/queue` : Lihat daftar antrean musik dengan pagination\n' +
            '• `/nowplaying` : Tampilkan player controller interaktif\n' +
            '• `/volume <1-100>` : Ubah tingkat volume musik\n' +
            '• `/loop <mode>` : Atur perulangan (Off / Song / Queue)\n' +
            '• `/autoplay` : Nyalakan/matikan putar otomatis lagu serupa\n' +
            '• `/seek <detik>` : Lompat ke durasi tertentu\n' +
            '• `/shuffle` : Acak antrean lagu\n',
        },
        {
          name: '📑 Perintah Custom Playlist',
          value:
            '• `/playlist play <nama>` : Putar playlist yang sudah disimpan\n' +
            '• `/playlist save <nama>` : Simpan antrean yang sedang aktif jadi playlist\n' +
            '• `/playlist add <nama> <lagu/link>` : Tambah lagu ke playlist tersimpan\n' +
            '• `/playlist list` : Lihat daftar custom playlist server\n' +
            '• `/playlist view <nama>` : Lihat lagu-lagu di dalam playlist\n' +
            '• `/playlist delete <nama>` : Hapus playlist tersimpan\n',
        },
        {
          name: '🎛️ Tombol Player Controller (MatchBox UI)',
          value:
            '• `QUEUE` : Lihat antrean lagu seketika\n' +
            '• `BACK` : Kembali ke lagu sebelumnya\n' +
            '• `PAUSE / RESUME` : Jeda atau lanjutkan lagu\n' +
            '• `SKIP` : Lewati lagu ke berikutnya\n' +
            '• `AUTOPLAY` : Toggle mode autoplay otomatis\n' +
            '• `LOOP` : Ganti mode perulangan lagu/antrean\n' +
            '• `REWIND` : Mundur 10 detik\n' +
            '• `STOP` : Hentikan lagu dan bersihkan player\n' +
            '• `FORWARD` : Maju 10 detik\n' +
            '• `REPLAY` : Ulangi lagu saat ini dari awal (00:00)\n',
        }
      )
      .setFooter({ text: 'Klik tombol pada pesan Now Playing untuk kontrol instan!' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
