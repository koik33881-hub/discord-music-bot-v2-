const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { createPlayerEmbed } = require('../../utils/playerEmbed');
const config = require('../../../config.json');

const PREFIX = config.prefix || '!';

module.exports = {
  name: 'messageCreate',
  /**
   * @param {import('discord.js').Message} message
   * @param {import('discord.js').Client} client
   */
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    let content = message.content.trim();
    console.log(`[DEBUG messageCreate] From: ${message.author.tag} | Content: ${JSON.stringify(content)}`);

    let isCommand = false;
    let cmdName = '';
    let args = [];

    // Split by any whitespace including newlines \n, \r, tabs, spaces
    if (content.startsWith(PREFIX)) {
      isCommand = true;
      args = content.slice(PREFIX.length).trim().split(/\s+/);
      cmdName = (args.shift() || '').toLowerCase();
    } else if (content.startsWith('/')) {
      // Fallback if user typed /play as regular text
      isCommand = true;
      args = content.slice(1).trim().split(/\s+/);
      cmdName = (args.shift() || '').toLowerCase();
    }

    if (!isCommand || !cmdName) return;

    const voiceChannel = message.member?.voice?.channel;
    const distube = client.distube;

    console.log(`[DEBUG Command Detected]: ${cmdName} | User VoiceChannel: ${voiceChannel?.name || 'NONE'}`);

    try {
      switch (cmdName) {
        case 'play':
        case 'p': {
          let query = args.join(' ').trim();
          if (!query) {
            return message.reply('❌ Harap masukkan judul lagu atau link! Contoh: `!play https://open.spotify.com/playlist/...`');
          }

          // Strip < > if present
          if (query.startsWith('<') && query.endsWith('>')) {
            query = query.slice(1, -1).trim();
          }

          // Suppress embed
          try {
            if (message.deletable) {
              await message.delete();
            } else {
              await message.suppressEmbeds(true);
            }
          } catch (_) {}

          if (!voiceChannel) {
            console.log('[DEBUG] User is NOT in a voice channel!');
            return message.channel.send({
              content: `<@${message.author.id}> ❌ Anda harus berada di dalam **Voice Channel** (klik channel suara seperti **Chill** / **General**) terlebih dahulu!`,
            });
          }

          const permissions = voiceChannel.permissionsFor(message.guild.members.me);
          if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            console.log('[DEBUG] Missing Voice Channel permissions');
            return message.channel.send({
              content: `<@${message.author.id}> ❌ Bot tidak memiliki izin untuk **Connect** atau **Speak** di Voice Channel ${voiceChannel.name}!`,
            });
          }

          const botVoiceChannel = message.guild.members.me?.voice?.channel;
          if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
            return message.channel.send({
              content: `<@${message.author.id}> ❌ Bot sudah terhubung di voice channel lain: **${botVoiceChannel.name}**!`,
            });
          }

          console.log(`[DEBUG] Attempting distube.play in channel "${voiceChannel.name}" for query: ${query}`);

          const searchingMsg = await message.channel.send({
            content: `🔍 **Mencari dan memproses:** \`${query.length > 100 ? query.slice(0, 97) + '...' : query}\` (oleh <@${message.author.id}>)`,
          });

          try {
            await distube.play(voiceChannel, query, {
              textChannel: message.channel,
              member: message.member,
            });
            console.log('[DEBUG] distube.play succeeded!');
          } catch (err) {
            console.error('[MessagePlay Error]:', err);
            await searchingMsg.edit(`❌ Gagal memutar musik: ${err.message || 'Sumber tidak ditemukan'}`);
          }
          break;
        }

        case 'pause': {
          const queue = distube.getQueue(message.guildId);
          if (!queue || !queue.songs || queue.songs.length === 0) {
            return message.reply('❌ Tidak ada musik yang sedang diputar!');
          }
          if (queue.paused) {
            return message.reply('⚠️ Pemutaran musik sudah dalam keadaan dijeda!');
          }
          queue.pause();
          if (queue.metadata?.playerMessage) {
            const p = createPlayerEmbed(queue, queue.songs[0], true);
            if (p) queue.metadata.playerMessage.edit(p).catch(() => {});
          }
          return message.reply('⏸️ Musik berhasil dijeda! Ketik `!resume` atau gunakan tombol RESUME.');
        }

        case 'resume':
        case 'unpause': {
          const queue = distube.getQueue(message.guildId);
          if (!queue || !queue.songs || queue.songs.length === 0) {
            return message.reply('❌ Tidak ada musik yang sedang diputar!');
          }
          if (!queue.paused) {
            return message.reply('⚠️ Musik sedang berjalan, tidak dijeda!');
          }
          queue.resume();
          if (queue.metadata?.playerMessage) {
            const p = createPlayerEmbed(queue, queue.songs[0], false);
            if (p) queue.metadata.playerMessage.edit(p).catch(() => {});
          }
          return message.reply('▶️ Musik berhasil dilanjutkan!');
        }

        case 'skip':
        case 's': {
          const queue = distube.getQueue(message.guildId);
          if (!queue || !queue.songs || queue.songs.length === 0) {
            return message.reply('❌ Tidak ada musik yang sedang diputar!');
          }
          if (queue.songs.length <= 1 && !queue.autoplay) {
            queue.stop();
            return message.reply('⏭️ Melewati lagu terakhir. Antrean selesai!');
          }
          await queue.skip();
          return message.reply('⏭️ Lagu berhasil dilewati!');
        }

        case 'stop':
        case 'dc':
        case 'leave': {
          const queue = distube.getQueue(message.guildId);
          if (!queue) {
            return message.reply('❌ Tidak ada musik yang sedang diputar!');
          }
          queue.stop();
          const stoppedEmbed = new EmbedBuilder()
            .setColor(config.errorColor || '#FF4444')
            .setTitle('⏹️ Pemutaran Dihentikan')
            .setDescription(`Musik dihentikan oleh <@${message.author.id}> dan antrean dibersihkan.`)
            .setTimestamp();
          return message.reply({ embeds: [stoppedEmbed] });
        }

        case 'queue':
        case 'q': {
          const queue = distube.getQueue(message.guildId);
          if (!queue || !queue.songs || queue.songs.length === 0) {
            return message.reply('📜 Antrean saat ini kosong!');
          }
          const nextSongs = queue.songs.slice(1, 11);
          let desc = `**Sedang Diputar:**\n[${queue.songs[0].name}](${queue.songs[0].url}) - \`${queue.songs[0].formattedDuration}\` (oleh: <@${queue.songs[0].user?.id}>)\n\n`;
          if (nextSongs.length > 0) {
            desc += `**Antrean Selanjutnya:**\n`;
            nextSongs.forEach((song, i) => {
              desc += `\`${i + 1}.\` [${song.name}](${song.url}) - \`${song.formattedDuration}\`\n`;
            });
          }
          const embed = new EmbedBuilder()
            .setColor(config.embedColor || '#00BFFF')
            .setTitle(`📜 Antrean Musik - ${message.guild.name}`)
            .setDescription(desc.slice(0, 4000))
            .setFooter({ text: `Total: ${queue.songs.length} lagu • Durasi: ${queue.formattedDuration}` });
          return message.reply({ embeds: [embed] });
        }

        case 'nowplaying':
        case 'np': {
          const queue = distube.getQueue(message.guildId);
          if (!queue || !queue.songs || queue.songs.length === 0) {
            return message.reply('❌ Tidak ada musik yang sedang diputar!');
          }
          const payload = createPlayerEmbed(queue, queue.songs[0]);
          if (payload) return message.reply(payload);
          break;
        }

        case 'volume':
        case 'vol':
        case 'v': {
          const queue = distube.getQueue(message.guildId);
          if (!queue) return message.reply('❌ Tidak ada musik yang sedang diputar!');
          const volNum = parseInt(args[0], 10);
          if (isNaN(volNum) || volNum < 1 || volNum > 100) {
            return message.reply('❌ Masukkan persentase volume antara 1 - 100! Contoh: `!volume 75`');
          }
          queue.setVolume(volNum);
          return message.reply(`🔊 Volume diubah menjadi **${volNum}%**!`);
        }

        case 'loop': {
          const queue = distube.getQueue(message.guildId);
          if (!queue) return message.reply('❌ Tidak ada musik yang sedang diputar!');
          const arg = (args[0] || '').toLowerCase();
          let mode = 0;
          if (arg === 'song' || arg === '1') mode = 1;
          else if (arg === 'queue' || arg === 'all' || arg === '2') mode = 2;
          else if (arg === 'off' || arg === '0') mode = 0;
          else mode = (queue.repeatMode + 1) % 3;

          queue.setRepeatMode(mode);
          const modeNames = ['Mati (Off)', 'Ulang Lagu Saat Ini (Song)', 'Ulang Seluruh Antrean (Queue)'];
          return message.reply(`🔁 Mode perulangan: **${modeNames[mode]}**!`);
        }

        case 'autoplay':
        case 'ap': {
          const queue = distube.getQueue(message.guildId);
          if (!queue) return message.reply('❌ Tidak ada musik yang sedang diputar!');
          const ap = queue.toggleAutoplay();
          return message.reply(`📻 Autoplay: **${ap ? 'Aktif (ON)' : 'Mati (OFF)'}**!`);
        }

        case 'help': {
          const embed = new EmbedBuilder()
            .setColor(config.embedColor || '#00BFFF')
            .setTitle('📖 Panduan Perintah Musik')
            .setDescription('Gunakan perintah slash (/) atau prefix (`!`):\n\n' +
              '• `!play <judul / url>` : Putar lagu dari YouTube, Spotify, dll.\n' +
              '• `!pause` & `!resume` : Jeda & lanjutkan musik\n' +
              '• `!skip` : Lewati lagu\n' +
              '• `!stop` : Hentikan musik & bersihkan antrean\n' +
              '• `!queue` : Lihat antrean lagu\n' +
              '• `!nowplaying` : Buka UI kontroler MatchBox\n' +
              '• `!volume <1-100>` : Atur volume suara\n' +
              '• `!loop` & `!autoplay` : Mode pengulangan & putar otomatis\n' +
              '• `/playlist` : Kelola custom playlist tersimpan\n'
            );
          return message.reply({ embeds: [embed] });
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[MessageCommand] Error:', err);
    }
  },
};
