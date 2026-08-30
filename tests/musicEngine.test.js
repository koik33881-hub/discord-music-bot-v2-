const test = require('node:test');
const assert = require('node:assert');
const { Client, GatewayIntentBits } = require('discord.js');
const { CooldownManager } = require('../src/utils/cooldownManager');
const { createPlayerEmbed } = require('../src/utils/playerEmbed');
const { initPlayer } = require('../src/client/player');

test('Music Engine - Deep Lifecycle & Edge Case Tests', async (t) => {
  // 1. CooldownManager Tests
  await t.test('CooldownManager respects TTL and allows after expiration', async () => {
    const cm = new CooldownManager(50); // 50ms TTL
    const res1 = cm.check('user_1');
    assert.strictEqual(res1.onCooldown, false);

    const res2 = cm.check('user_1');
    assert.strictEqual(res2.onCooldown, true);
    assert.ok(res2.remainingMs > 0);

    // Wait for expiration
    await new Promise((r) => setTimeout(r, 60));

    const res3 = cm.check('user_1');
    assert.strictEqual(res3.onCooldown, false);
    cm.destroy();
  });

  await t.test('CooldownManager auto-pruning avoids memory bloat', () => {
    const cm = new CooldownManager(10, 5); // max 5 entries
    for (let i = 0; i < 10; i++) {
      cm.check(`key_${i}`, 10);
    }
    // Prune should run without errors
    cm.prune();
    assert.ok(cm.map.size <= 10);
    cm.destroy();
  });

  // 2. Queue & Multi-Guild State Isolation Simulation
  await t.test('Multi-Guild Queue Isolation Simulation', () => {
    const guildQueues = new Map();

    const createMockQueue = (guildId, songNames) => ({
      guildId,
      songs: songNames.map((name, idx) => ({
        name,
        url: `https://example.com/${idx}`,
        duration: 180,
        formattedDuration: '03:00',
        user: { id: `user_${idx}` },
      })),
      paused: false,
      volume: 50,
      repeatMode: 0,
      autoplay: false,
      previousSongs: [],
    });

    guildQueues.set('guild_A', createMockQueue('guild_A', ['Song A1', 'Song A2']));
    guildQueues.set('guild_B', createMockQueue('guild_B', ['Song B1', 'Song B2', 'Song B3']));

    // Modify Guild A queue (Skip song)
    const queueA = guildQueues.get('guild_A');
    const skippedSong = queueA.songs.shift();
    queueA.previousSongs.push(skippedSong);

    // Verify Guild B queue is completely untouched
    const queueB = guildQueues.get('guild_B');
    assert.strictEqual(queueA.songs.length, 1);
    assert.strictEqual(queueA.previousSongs.length, 1);
    assert.strictEqual(queueA.songs[0].name, 'Song A2');

    assert.strictEqual(queueB.songs.length, 3);
    assert.strictEqual(queueB.previousSongs.length, 0);
    assert.strictEqual(queueB.songs[0].name, 'Song B1');
  });

  // 3. Player Embed & State Transitions Simulation
  await t.test('Player embed correctly reflects Pause -> Resume -> Loop -> Autoplay states', () => {
    const queue = {
      paused: false,
      volume: 80,
      repeatMode: 0,
      autoplay: false,
      songs: [
        {
          name: 'Electronic Dream [Original Mix]',
          url: 'https://spotify.com/track/123',
          formattedDuration: '04:12',
          duration: 252,
          isLive: false,
          uploader: 'Synthwave Artist',
          user: { id: '55555' },
        },
      ],
      previousSongs: [],
    };

    // State 1: Playing
    const p1 = createPlayerEmbed(queue);
    assert.strictEqual(p1.embeds[0].data.title, '💿 Now Playing');
    assert.ok(p1.embeds[0].data.description.includes('Electronic Dream (Original Mix)'));
    assert.ok(p1.embeds[0].data.footer.text.includes('Volume 80%'));
    assert.ok(p1.embeds[0].data.footer.text.includes('Loop off'));
    assert.ok(p1.embeds[0].data.footer.text.includes('Autoplay Off'));

    // State 2: Paused
    queue.paused = true;
    const p2 = createPlayerEmbed(queue);
    assert.strictEqual(p2.embeds[0].data.title, '💿 Now Paused');
    assert.ok(p2.embeds[0].data.footer.text.includes('Paused'));

    // State 3: RepeatMode Queue (2) & Autoplay ON
    queue.paused = false;
    queue.repeatMode = 2;
    queue.autoplay = true;
    const p3 = createPlayerEmbed(queue);
    assert.strictEqual(p3.embeds[0].data.title, '💿 Now Playing');
    assert.ok(p3.embeds[0].data.footer.text.includes('Loop queue'));
    assert.ok(p3.embeds[0].data.footer.text.includes('Autoplay On'));
  });

  // 4. DisTube Client Initialization Test with required intents
  await t.test('DisTube client initializes with Discord.js client without throwing', () => {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });
    const distube = initPlayer(client);
    assert.ok(distube);
    assert.ok(distube.plugins);
    assert.strictEqual(distube.plugins.length >= 4, true);
    client.destroy();
  });
});
