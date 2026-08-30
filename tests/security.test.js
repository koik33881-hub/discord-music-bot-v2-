const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

test('Security & Secret Leaks Audit Tests', async (t) => {
  await t.test('config.json does not contain hardcoded tokens or secrets', () => {
    const raw = JSON.stringify(config);
    assert.strictEqual(raw.includes('DISCORD_TOKEN'), false);
    assert.strictEqual(raw.includes('your_bot_token'), false);
  });

  await t.test('.gitignore contains .env and node_modules', () => {
    const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf-8');
    assert.ok(gitignore.includes('.env'));
    assert.ok(gitignore.includes('node_modules'));
  });

  await t.test('.dockerignore contains .env and node_modules', () => {
    const dockerignore = fs.readFileSync(path.join(__dirname, '../.dockerignore'), 'utf-8');
    assert.ok(dockerignore.includes('.env'));
    assert.ok(dockerignore.includes('node_modules'));
  });

  await t.test('Source code files do not contain exposed raw tokens', () => {
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // Check for discord token pattern (M/N/O followed by 23+ chars . 6 chars . 27+ chars)
          const tokenRegex = /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/;
          assert.strictEqual(
            tokenRegex.test(content),
            false,
            `Found possible raw token in ${fullPath}`
          );
        }
      }
    };

    scanDir(path.join(__dirname, '../src'));
  });
});
