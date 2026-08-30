const test = require('node:test');
const assert = require('node:assert');
const { createPlayerEmbed, escapeMarkdownTitle } = require('../src/utils/playerEmbed');

test('PlayerEmbed - Unit & Edge Case Tests', async (t) => {
  await t.test('escapeMarkdownTitle replaces brackets', () => {
    assert.strictEqual(escapeMarkdownTitle('Song [Official Video]'), 'Song (Official Video)');
    assert.strictEqual(escapeMarkdownTitle(null), 'Unknown Title');
  });

  await t.test('createPlayerEmbed returns null if queue or songs are empty', () => {
    assert.strictEqual(createPlayerEmbed(null), null);
    assert.strictEqual(createPlayerEmbed({ songs: [] }), null);
  });

  await t.test('createPlayerEmbed generates complete 4-row button layout', () => {
    const mockQueue = {
      paused: false,
      volume: 75,
      repeatMode: 1,
      autoplay: true,
      songs: [
        {
          name: 'Awesome [Remix] Song',
          url: 'https://youtube.com/watch?v=xyz',
          formattedDuration: '03:30',
          duration: 210,
          isLive: false,
          uploader: { name: 'Super Producer' },
          user: { id: '123456789' },
          thumbnail: 'https://example.com/thumb.jpg',
        },
      ],
      previousSongs: [{ name: 'Previous Song' }],
    };

    const payload = createPlayerEmbed(mockQueue);
    assert.ok(payload);
    assert.strictEqual(payload.embeds.length, 1);
    assert.strictEqual(payload.components.length, 4);

    const embed = payload.embeds[0].data;
    assert.strictEqual(embed.title, '💿 Now Playing');
    assert.ok(embed.description.includes('Awesome (Remix) Song'));
    assert.ok(embed.description.includes('<@123456789>'));
    assert.ok(embed.footer.text.includes('Volume 75%'));
    assert.ok(embed.footer.text.includes('Loop song'));
    assert.ok(embed.footer.text.includes('Autoplay On'));

    // Check row 1 buttons
    const row1Buttons = payload.components[0].components;
    assert.strictEqual(row1Buttons.length, 4);
    assert.strictEqual(row1Buttons[0].data.label, 'QUEUE');
    assert.strictEqual(row1Buttons[1].data.label, 'BACK');
    assert.strictEqual(row1Buttons[1].data.disabled, false);
    assert.strictEqual(row1Buttons[2].data.label, 'PAUSE');
    assert.strictEqual(row1Buttons[3].data.label, 'SKIP');
  });

  await t.test('createPlayerEmbed handles live stream appropriately', () => {
    const mockQueue = {
      paused: false,
      volume: 50,
      repeatMode: 0,
      autoplay: false,
      songs: [
        {
          name: '24/7 Lofi Radio',
          url: 'https://youtube.com/watch?v=live',
          formattedDuration: 'Live',
          duration: 0,
          isLive: true,
          uploader: 'Lofi Girl',
          user: { id: '987654321' },
        },
      ],
      previousSongs: [],
    };

    const payload = createPlayerEmbed(mockQueue);
    assert.ok(payload);

    // Row 3 buttons (REWIND, FORWARD should be disabled for live)
    const row3Buttons = payload.components[2].components;
    assert.strictEqual(row3Buttons[1].data.label, 'REWIND');
    assert.strictEqual(row3Buttons[1].data.disabled, true);
    assert.strictEqual(row3Buttons[3].data.label, 'FORWARD');
    assert.strictEqual(row3Buttons[3].data.disabled, true);

    // Row 4 button (REPLAY should be disabled for live)
    const row4Buttons = payload.components[3].components;
    assert.strictEqual(row4Buttons[0].data.label, 'REPLAY');
    assert.strictEqual(row4Buttons[0].data.disabled, true);
  });
});
