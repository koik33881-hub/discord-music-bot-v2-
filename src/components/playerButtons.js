const { EmbedBuilder } = require('discord.js');
const { createPlayerEmbed } = require('../utils/playerEmbed');
const { CooldownManager } = require('../utils/cooldownManager');
const config = require('../../config.json');

// Memory-safe button debounce manager
const buttonCooldowns = new CooldownManager(config.buttonCooldownMs || 1000);

/**
 * Handle button clicks from the Now Playing player UI
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {import('distube').DisTube} distube
 */
async function handlePlayerButtons(interaction, distube) {
  const userId = interaction.user.id;
  const cooldownKey = `btn_${interaction.guildId}_${userId}`;
  const cooldownCheck = buttonCooldowns.check(cooldownKey);

  if (cooldownCheck.onCooldown) {
    return interaction.reply({
      content: '⏳ Harap tunggu sebentar sebelum menekan tombol lagi.',
      ephemeral: true,
    });
  }

  const memberVoiceChannel = interaction.member?.voice?.channel;
  const botVoiceChannel = interaction.guild?.members?.me?.voice?.channel;

  if (!memberVoiceChannel) {
    return interaction.reply({
      content: '❌ Anda harus berada di Voice Channel untuk menggunakan tombol ini!',
      ephemeral: true,
    });
  }

  if (botVoiceChannel && botVoiceChannel.id !== memberVoiceChannel.id) {
    return interaction.reply({
      content: `❌ Anda harus berada di Voice Channel yang sama (**${botVoiceChannel.name}**)!`,
      ephemeral: true,
    });
  }

  const queue = distube.getQueue(interaction.guildId);
  if (!queue || !queue.songs || queue.songs.length === 0) {
    return interaction.reply({
      content: '❌ Tidak ada musik yang sedang diputar!',
      ephemeral: true,
    });
  }

  const customId = interaction.customId;
  const currentSong = queue.songs[0];
  const isLive = Boolean(currentSong?.isLive || currentSong?.duration === 0);

  try {
    switch (customId) {
      case 'player_pause_resume': {
        if (queue.paused) {
          queue.resume();
          const playerPayload = createPlayerEmbed(queue, currentSong, false);
          if (playerPayload) await interaction.update(playerPayload);
          else await interaction.deferUpdate();
        } else {
          queue.pause();
          const playerPayload = createPlayerEmbed(queue, currentSong, true);
          if (playerPayload) await interaction.update(playerPayload);
          else await interaction.deferUpdate();
        }
        break;
      }

      case 'player_skip': {
        if (queue.songs.length <= 1 && !queue.autoplay) {
          queue.stop();
          return interaction.reply({
            content: '⏭️ Melewati lagu terakhir. Antrean selesai!',
            ephemeral: true,
          });
        }
        await queue.skip();
        await interaction.reply({
          content: '⏭️ Lagu berhasil dilewati!',
          ephemeral: true,
        });
        break;
      }

      case 'player_back': {
        if (!queue.previousSongs || queue.previousSongs.length === 0) {
          return interaction.reply({
            content: '⏮️ Tidak ada lagu sebelumnya dalam riwayat pemutaran!',
            ephemeral: true,
          });
        }
        await queue.previous();
        await interaction.reply({
          content: '⏮️ Memutar kembali lagu sebelumnya!',
          ephemeral: true,
        });
        break;
      }

      case 'player_stop': {
        queue.stop();
        const stoppedEmbed = new EmbedBuilder()
          .setColor(config.errorColor || '#FF4444')
          .setTitle('⏹️ Pemutaran Dihentikan')
          .setDescription(`Musik dihentikan oleh <@${interaction.user.id}> dan antrean dibersihkan.`)
          .setTimestamp();

        await interaction.update({
          embeds: [stoppedEmbed],
          components: [],
        });
        break;
      }

      case 'player_autoplay': {
        queue.toggleAutoplay();
        const playerPayload = createPlayerEmbed(queue, currentSong);
        if (playerPayload) await interaction.update(playerPayload);
        else await interaction.deferUpdate();
        break;
      }

      case 'player_loop': {
        // Mode 0: Off, Mode 1: Song, Mode 2: Queue
        const newMode = (queue.repeatMode + 1) % 3;
        queue.setRepeatMode(newMode);
        const playerPayload = createPlayerEmbed(queue, currentSong);
        if (playerPayload) await interaction.update(playerPayload);
        else await interaction.deferUpdate();
        break;
      }

      case 'player_rewind': {
        if (isLive) {
          return interaction.reply({
            content: '❌ Tidak dapat memundurkan siaran Live!',
            ephemeral: true,
          });
        }
        const targetTime = Math.max(0, queue.currentTime - 10);
        await queue.seek(targetTime);
        await interaction.reply({
          content: `⏪ Mundur 10 detik (${targetTime}s)`,
          ephemeral: true,
        });
        break;
      }

      case 'player_forward': {
        if (isLive) {
          return interaction.reply({
            content: '❌ Tidak dapat memajukan siaran Live!',
            ephemeral: true,
          });
        }
        const maxDuration = currentSong.duration || 0;
        const targetTime = Math.min(maxDuration, queue.currentTime + 10);
        await queue.seek(targetTime);
        await interaction.reply({
          content: `⏩ Maju 10 detik (${targetTime}s)`,
          ephemeral: true,
        });
        break;
      }

      case 'player_replay': {
        if (isLive) {
          return interaction.reply({
            content: '❌ Tidak dapat mengulang siaran Live!',
            ephemeral: true,
          });
        }
        await queue.seek(0);
        await interaction.reply({
          content: '🔄 Mengulang lagu saat ini dari awal!',
          ephemeral: true,
        });
        break;
      }

      case 'player_queue': {
        if (!queue || !queue.songs || queue.songs.length === 0) {
          return interaction.reply({
            content: '📜 Antrean saat ini kosong!',
            ephemeral: true,
          });
        }

        const nextSongs = queue.songs.slice(1, 11);
        let description = `**Sedang Diputar:**\n[${currentSong.name}](${currentSong.url}) - \`${currentSong.formattedDuration}\` (oleh: <@${currentSong.user?.id || 'Unknown'}>)\n\n`;

        if (nextSongs.length > 0) {
          description += `**Daftar Antrean Selanjutnya:**\n`;
          nextSongs.forEach((song, i) => {
            description += `\`${i + 1}.\` [${song.name}](${song.url}) - \`${song.formattedDuration}\`\n`;
          });
          if (queue.songs.length > 11) {
            description += `\n*...dan ${queue.songs.length - 11} lagu lainnya.*`;
          }
        } else {
          description += `*Tidak ada lagu lain dalam antrean.*`;
        }

        const queueEmbed = new EmbedBuilder()
          .setColor(config.embedColor || '#00BFFF')
          .setTitle(`📜 Antrean Musik - ${interaction.guild.name}`)
          .setDescription(description.slice(0, 4000))
          .setFooter({
            text: `Total: ${queue.songs.length} lagu • Durasi: ${queue.formattedDuration}`,
          })
          .setTimestamp();

        await interaction.reply({
          embeds: [queueEmbed],
          ephemeral: true,
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error('[ButtonHandler] Error handling player button:', error.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `❌ Terjadi kesalahan: ${error.message}`,
        ephemeral: true,
      });
    }
  }
}

module.exports = { handlePlayerButtons, buttonCooldowns };
