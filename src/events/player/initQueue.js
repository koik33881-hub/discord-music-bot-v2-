const config = require('../../../config.json');

module.exports = {
  name: 'initQueue',
  /**
   * @param {import('distube').Queue} queue
   */
  async execute(queue) {
    try {
      if (typeof config.defaultVolume === 'number') {
        queue.setVolume(config.defaultVolume);
      }
      queue.autoplay = false;
    } catch (error) {
      console.error('[InitQueue Event] Error:', error.message);
    }
  },
};
