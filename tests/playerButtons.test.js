const test = require('node:test');
const assert = require('node:assert');
const { handlePlayerButtons, buttonCooldowns } = require('../src/components/playerButtons');

test('PlayerButtons - Interaction Logic Tests', async (t) => {
  t.beforeEach(() => {
    buttonCooldowns.clear();
  });

  await t.test('Rejects button interaction if user is not in voice channel', async () => {
    let replyPayload = null;
    const mockInteraction = {
      user: { id: 'user_123' },
      guildId: 'guild_123',
      member: { voice: { channel: null } },
      reply: (payload) => {
        replyPayload = payload;
        return Promise.resolve();
      },
    };

    const mockDistube = {};
    await handlePlayerButtons(mockInteraction, mockDistube);

    assert.ok(replyPayload);
    assert.ok(replyPayload.content.includes('Anda harus berada di Voice Channel'));
  });

  await t.test('Enforces button cooldown to prevent spam', async () => {
    let replyPayload = null;
    const mockInteraction = {
      user: { id: 'user_spam' },
      guildId: 'guild_123',
      member: { voice: { channel: { id: 'voice_1', name: 'General' } } },
      guild: { members: { me: { voice: { channel: { id: 'voice_1', name: 'General' } } } } },
      customId: 'player_skip',
      reply: (payload) => {
        replyPayload = payload;
        return Promise.resolve();
      },
    };

    const mockDistube = {
      getQueue: () => ({
        songs: [{ name: 'Test' }],
        stop: () => {},
        skip: () => Promise.resolve(),
      }),
    };

    // First click sets cooldown
    await handlePlayerButtons(mockInteraction, mockDistube);
    assert.strictEqual(buttonCooldowns.map.has('btn_guild_123_user_spam'), true);

    // Immediate second click triggers cooldown
    replyPayload = null;
    await handlePlayerButtons(mockInteraction, mockDistube);
    assert.ok(replyPayload);
    assert.ok(replyPayload.content.includes('Harap tunggu sebentar'));
  });
});
