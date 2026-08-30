module.exports = {
  name: 'deleteQueue',
  /**
   * @param {import('distube').Queue} queue
   */
  async execute(queue) {
    try {
      if (queue.metadata?.playerMessage) {
        try {
          await queue.metadata.playerMessage.edit({ components: [] });
        } catch (_) {
          // Message might already be deleted
        }
      }
      queue.metadata = {};
    } catch (error) {
      console.error('[DeleteQueue Event] Error:', error.message);
    }
  },
};
