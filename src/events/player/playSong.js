const { createPlayerEmbed } = require('../../utils/playerEmbed');

module.exports = {
  name: 'playSong',
  /**
   * @param {import('distube').Queue} queue
   * @param {import('distube').Song} song
   */
  async execute(queue, song) {
    if (!queue.textChannel) return;

    try {
      const payload = createPlayerEmbed(queue, song, false);
      if (!payload) return;

      // Clean up previous player controller message to prevent chat clutter & dead buttons
      if (queue.metadata?.playerMessage) {
        try {
          await queue.metadata.playerMessage.delete().catch(() => {});
        } catch (_) {}
      }

      // Send the active player controller message
      const playerMessage = await queue.textChannel.send(payload);
      queue.metadata = {
        ...(queue.metadata || {}),
        playerMessage: playerMessage,
      };
    } catch (error) {
      console.error('[PlaySong Event] Error updating player message:', error.message);
    }
  },
};
