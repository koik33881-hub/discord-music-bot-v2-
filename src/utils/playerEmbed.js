const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config.json');

/**
 * Clean string for Discord Markdown link titles to avoid breaking markdown syntax
 * @param {string} text
 * @returns {string}
 */
function escapeMarkdownTitle(text) {
  if (!text || typeof text !== 'string') return 'Unknown Title';
  return text.replace(/\[/g, '(').replace(/\]/g, ')').trim();
}

/**
 * Builds the MatchBox style Now Playing / Now Paused embed and interactive button rows
 * @param {import('distube').Queue} queue
 * @param {import('distube').Song} [song]
 * @param {boolean} [isPaused]
 * @returns {{ embeds: EmbedBuilder[], components: ActionRowBuilder[] } | null}
 */
function createPlayerEmbed(queue, song = null, isPaused = null) {
  if (!queue) return null;

  const currentSong = song || (queue.songs && queue.songs.length > 0 ? queue.songs[0] : null);
  if (!currentSong) return null;

  const paused = isPaused !== null ? isPaused : Boolean(queue.paused);
  const isLive = Boolean(currentSong.isLive || currentSong.duration === 0);

  // Format loop mode string
  let loopText = 'off';
  if (queue.repeatMode === 1) loopText = 'song';
  else if (queue.repeatMode === 2) loopText = 'queue';

  // Format current time
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const safeTitle = escapeMarkdownTitle(currentSong.name);
  const safeUrl = currentSong.url || 'https://discord.com';
  const safeDuration = isLive ? '🔴 LIVE' : (currentSong.formattedDuration || '00:00');
  const safeRequester = currentSong.user?.id ? `<@${currentSong.user.id}>` : '@Unknown';
  const safeUploader = escapeMarkdownTitle(currentSong.uploader?.name || currentSong.uploader || 'Unknown Artist');

  const embed = new EmbedBuilder()
    .setColor(paused ? '#FFA500' : (config.embedColor || '#00BFFF'))
    .setTitle(paused ? '💿 Now Paused' : '💿 Now Playing')
    .setDescription(
      `**[${safeTitle}](${safeUrl})**\n` +
      `${safeDuration} • [ ${safeRequester} ]\n` +
      `Song By: ${safeUploader}`
    )
    .setFooter({
      text: `${paused ? 'Paused' : 'Playing'} • Volume ${queue.volume || 50}% • Queue ${queue.songs?.length || 1} • Loop ${loopText} • Autoplay ${queue.autoplay ? 'On' : 'Off'} • ${timeString}`,
    });

  if (currentSong.thumbnail && typeof currentSong.thumbnail === 'string') {
    embed.setThumbnail(currentSong.thumbnail);
  }

  // Row 1: QUEUE, BACK, PAUSE/RESUME, SKIP
  const hasPrevious = Array.isArray(queue.previousSongs) && queue.previousSongs.length > 0;
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('player_queue')
      .setLabel('QUEUE')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('player_back')
      .setLabel('BACK')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPrevious),
    new ButtonBuilder()
      .setCustomId('player_pause_resume')
      .setLabel(paused ? 'RESUME' : 'PAUSE')
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('player_skip')
      .setLabel('SKIP')
      .setStyle(ButtonStyle.Secondary)
  );

  // Row 2: AUTOPLAY
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('player_autoplay')
      .setLabel('AUTOPLAY')
      .setStyle(queue.autoplay ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  // Row 3: LOOP, REWIND, STOP, FORWARD
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('player_loop')
      .setLabel('LOOP')
      .setStyle(queue.repeatMode > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('player_rewind')
      .setLabel('REWIND')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isLive),
    new ButtonBuilder()
      .setCustomId('player_stop')
      .setLabel('STOP')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('player_forward')
      .setLabel('FORWARD')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isLive)
  );

  // Row 4: REPLAY
  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('player_replay')
      .setLabel('REPLAY')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(isLive)
  );

  return {
    embeds: [embed],
    components: [row1, row2, row3, row4],
  };
}

module.exports = { createPlayerEmbed, escapeMarkdownTitle };
