const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Commands Schema & Validation Tests', async (t) => {
  const commandsDir = path.join(__dirname, '../src/commands');
  const categories = fs.readdirSync(commandsDir);

  const commandFiles = [];
  for (const cat of categories) {
    const catPath = path.join(commandsDir, cat);
    if (fs.lstatSync(catPath).isDirectory()) {
      const files = fs.readdirSync(catPath).filter((f) => f.endsWith('.js'));
      for (const f of files) {
        commandFiles.push(path.join(catPath, f));
      }
    }
  }

  await t.test(`Loaded ${commandFiles.length} commands`, () => {
    assert.ok(commandFiles.length >= 13, `Expected at least 13 commands, found ${commandFiles.length}`);
  });

  for (const filePath of commandFiles) {
    const basename = path.basename(filePath);
    await t.test(`Validate command structure: ${basename}`, () => {
      const command = require(filePath);
      assert.ok(command.data, `${basename} missing .data`);
      assert.ok(typeof command.execute === 'function', `${basename} missing execute function`);

      const json = command.data.toJSON();
      assert.ok(json.name, `${basename} missing name`);
      assert.ok(json.description, `${basename} missing description`);
      assert.strictEqual(json.name, json.name.toLowerCase(), `${basename} name must be lowercase`);
    });
  }
});
