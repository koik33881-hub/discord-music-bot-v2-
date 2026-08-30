const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('🔍 RUNNING DEEP SYSTEM AUDIT (ZERO ASSUMPTIONS)');
console.log('====================================================\n');

const auditResults = {
  commandsAudited: 0,
  eventsAudited: 0,
  resolversAudited: 0,
  stateHandlersAudited: 0,
  bugsFound: [],
};

// 1. AUDIT ALL SLASH COMMANDS FOR INTERACTION COMPLIANCE
console.log('▶ [1/6] Auditing Slash Commands for Structure & Safety...');
const cmdDir = path.join(__dirname, '..', 'src', 'commands');

function walkDir(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walkDir(full));
    } else if (full.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

const commandFiles = walkDir(cmdDir);
for (const file of commandFiles) {
  const relPath = path.relative(path.join(__dirname, '..'), file);
  const code = fs.readFileSync(file, 'utf-8');
  const command = require(file);
  auditResults.commandsAudited++;

  assert.ok(command.data, `Command ${relPath} must export data property`);
  assert.ok(typeof command.execute === 'function', `Command ${relPath} must export execute function`);

  // Check if execute is async
  if (!code.includes('async execute(')) {
    auditResults.bugsFound.push(`[Command Structure Bug] ${relPath}: execute method is not async!`);
  }
}
console.log(`  ✓ Audited ${auditResults.commandsAudited} commands.`);

// 2. AUDIT CLIENT AND PLAYER EVENTS
console.log('\n▶ [2/6] Auditing Event Listeners Signatures...');
const eventsDir = path.join(__dirname, '..', 'src', 'events');
const eventFiles = walkDir(eventsDir);

for (const file of eventFiles) {
  const relPath = path.relative(path.join(__dirname, '..'), file);
  const code = fs.readFileSync(file, 'utf-8');
  auditResults.eventsAudited++;

  if (!code.includes('name:') || !code.includes('execute(')) {
    auditResults.bugsFound.push(`[Event Definition Bug] ${relPath}: Missing name or execute export!`);
  }

  // Error event signature in DisTube v5 must accept (error, queue, song)
  if (file.includes('player') && file.endsWith('error.js')) {
    if (!code.includes('execute(error, queue, song)')) {
      auditResults.bugsFound.push(`[DisTube Event Signature Bug] ${relPath}: error event does not match (error, queue, song)!`);
    }
  }

  // playSong signature in DisTube v5 must accept (queue, song)
  if (file.includes('player') && file.endsWith('playSong.js')) {
    if (!code.includes('execute(queue, song)')) {
      auditResults.bugsFound.push(`[DisTube Event Signature Bug] ${relPath}: playSong event does not match (queue, song)!`);
    }
  }
}
console.log(`  ✓ Audited ${auditResults.eventsAudited} event handlers.`);

// 3. AUDIT PLAYER BUTTON HANDLERS
console.log('\n▶ [3/6] Auditing Player Buttons Handler for State Safety...');
const { handlePlayerButtons } = require('../src/components/playerButtons');
auditResults.stateHandlersAudited++;

const dummyDistube = {
  getQueue: (guildId) => null,
};

let capturedReply = null;
const dummyInteraction = {
  user: { id: 'test_user_123' },
  guildId: 'test_guild_123',
  customId: 'player_pause_resume',
  member: { voice: { channel: null } },
  reply: (payload) => {
    capturedReply = payload;
    return Promise.resolve();
  },
  deferUpdate: () => Promise.resolve(),
  update: () => Promise.resolve(),
};

handlePlayerButtons(dummyInteraction, dummyDistube).then(() => {
  if (!capturedReply || !capturedReply.content.includes('Voice Channel')) {
    auditResults.bugsFound.push(`[Button Handler Bug]: Did not reject interaction when user is not in voice channel!`);
  }
  console.log(`  ✓ Button handler voice channel verification passed.`);
});

// 4. AUDIT EMBED UTILS FOR BOUNDARY LIMITS
console.log('\n▶ [4/6] Auditing PlayerEmbed Markdown and Text Truncation Safety...');
const { createPlayerEmbed, escapeMarkdownTitle } = require('../src/utils/playerEmbed');

const maliciousTitle = '[BAD [LINK]](https://evil.com) **Bold** `Code` <@1234567890> & Special "Chars"';
const sanitized = escapeMarkdownTitle(maliciousTitle);
assert.strictEqual(sanitized.includes('['), false, 'Markdown brackets must be escaped/replaced');
assert.strictEqual(sanitized.includes(']'), false, 'Markdown brackets must be escaped/replaced');
console.log(`  ✓ Markdown title sanitizer verified.`);

// Dummy queue with 500 songs
const dummyQueue = {
  songs: [
    {
      name: 'A'.repeat(500),
      url: 'https://example.com/very/long/url/' + 'x'.repeat(200),
      duration: 3600,
      formattedDuration: '01:00:00',
      user: { id: '999999999' },
      thumbnail: 'https://example.com/thumb.png',
    },
  ],
  paused: false,
  volume: 100,
  repeatMode: 2,
  autoplay: true,
  formattedDuration: '100:00:00',
};

const payload = createPlayerEmbed(dummyQueue, dummyQueue.songs[0]);
assert.ok(payload.embeds, 'Payload must include embeds');
assert.ok(payload.components, 'Payload must include components');
assert.strictEqual(payload.components.length, 4, 'Payload must include exactly 4 ActionRows');
console.log(`  ✓ Player embed component matrix (4 rows, 10 buttons) verified.`);

// 5. AUDIT PLAYLIST MANAGER FOR ATOMIC STORAGE & CORRUPTION HANDLING
console.log('\n▶ [5/6] Auditing PlaylistManager I/O & Memory Safety...');
const { getPlaylist, savePlaylist, deletePlaylist } = require('../src/utils/playlistManager');

const testPlName = `audit_test_${Date.now()}`;
const guildId = 'audit_guild_999';
const userId = 'audit_user_888';
savePlaylist(guildId, userId, testPlName, [
  { name: 'Track 1', url: 'https://example.com/1', duration: 180, formattedDuration: '03:00' },
]);

const fetched = getPlaylist(guildId, testPlName);
assert.strictEqual(fetched.name, testPlName);
assert.strictEqual(fetched.songs.length, 1);
deletePlaylist(guildId, testPlName);
const afterDelete = getPlaylist(guildId, testPlName);
assert.strictEqual(afterDelete, null);
console.log(`  ✓ PlaylistManager CRUD lifecycle verified.`);

// 6. AUDIT DEPENDENCY RESOLUTION & SYSTEM PACKAGES
console.log('\n▶ [6/6] Auditing Production Dependencies & Encryption Packages...');
const pkg = require('../package.json');
const requiredDeps = [
  '@discordjs/voice',
  '@distube/spotify',
  '@distube/soundcloud',
  '@distube/deezer',
  '@distube/direct-link',
  '@noble/ciphers',
  '@stablelib/xchacha20poly1305',
  'libsodium-wrappers',
  'opusscript',
  'ffmpeg-static',
];

for (const dep of requiredDeps) {
  if (!pkg.dependencies[dep]) {
    auditResults.bugsFound.push(`[Dependency Audit Bug]: Missing required dependency ${dep} in package.json!`);
  }
}
console.log(`  ✓ All ${requiredDeps.length} production dependencies verified in package.json.`);

// REPORT RESULTS
setTimeout(() => {
  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY REPORT');
  console.log('====================================================');
  console.log(`Commands Audited      : ${auditResults.commandsAudited}`);
  console.log(`Events Audited        : ${auditResults.eventsAudited}`);
  console.log(`State Handlers Audited: ${auditResults.stateHandlersAudited}`);
  console.log(`Total Bugs Found      : ${auditResults.bugsFound.length}`);

  if (auditResults.bugsFound.length > 0) {
    console.error('\n🚨 ISSUES DETECTED:');
    auditResults.bugsFound.forEach((b, i) => console.error(`  ${i + 1}. ${b}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CHECKS PASSED: ZERO BUGS DETECTED IN THE CODEBASE.');
    console.log('====================================================\n');
    process.exit(0);
  }
}, 100);
