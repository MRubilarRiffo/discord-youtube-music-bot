import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Slash Commands Validation & Integrity', () => {
  it('every command file exports valid SlashCommand data and execute function', async () => {
    const commandsPath = path.resolve(__dirname, '../../src/commands');
    const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

    assert.ok(commandFiles.length >= 10, 'Expected at least 10 commands');

    const expectedCommands = [
      'play',
      'pause',
      'resume',
      'skip',
      'stop',
      'queue',
      'nowplaying',
      'volume',
      'help',
      'loop',
      'shuffle',
      'skipto',
      'remove',
      'clear',
      'previous',
    ];

    for (const name of expectedCommands) {
      assert.ok(
        commandFiles.includes(`${name}.js`),
        `Expected command file ${name}.js to exist`
      );
    }

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const mod = await import(pathToFileURL(filePath).href);
      const command = mod.default;

      assert.ok(command, `Command ${file} should export default`);
      assert.ok(command.data, `Command ${file} should have a data property`);
      assert.ok(typeof command.execute === 'function', `Command ${file} should have an execute function`);

      const json = command.data.toJSON();
      assert.ok(json.name, `Command ${file} should have a valid name`);
      assert.ok(json.description, `Command ${file} should have a description`);
    }
  });
});
