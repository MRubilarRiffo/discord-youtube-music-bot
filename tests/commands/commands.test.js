import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { QueueManager } from '../../src/music/QueueManager.js';
import { createMockInteraction } from '../helpers/discordMock.js';
import loopCommand from '../../src/commands/loop.js';
import shuffleCommand from '../../src/commands/shuffle.js';
import skiptoCommand from '../../src/commands/skipto.js';
import removeCommand from '../../src/commands/remove.js';
import clearCommand from '../../src/commands/clear.js';
import previousCommand from '../../src/commands/previous.js';
import queueCommand from '../../src/commands/queue.js';
import { LoopMode } from '../../src/domain/Queue.js';

describe('Discord Commands: Queue Management & Phase 1/2', () => {
  let queueManager;
  let queue;

  beforeEach(() => {
    queueManager = new QueueManager();
    queue = queueManager.getOrCreate('guild-1', {
      skipListeners: true,
      getAudioStream: async () => 'https://example.com/fake-stream',
      player: {
        state: { status: 'idle' },
        play: () => {},
        pause: () => true,
        unpause: () => true,
        stop: () => {},
        on: () => {},
      },
    });
    queue.voiceChannel = { id: 'voice-1' };
  });

  it('/loop toggles loop mode or sets specific mode', async () => {
    queue.addSong({ title: 'Song 1', url: 'https://youtube.com/1' });

    // Toggle without option
    const interactionToggle = createMockInteraction();
    await loopCommand.execute(interactionToggle, queueManager);
    assert.equal(queue.loopMode, LoopMode.SONG);
    assert.ok(interactionToggle.replyPayload);

    // Set specific mode 'queue'
    const interactionQueue = createMockInteraction({ options: { modo: 'queue' } });
    await loopCommand.execute(interactionQueue, queueManager);
    assert.equal(queue.loopMode, LoopMode.QUEUE);

    // Set specific mode 'off'
    const interactionOff = createMockInteraction({ options: { modo: 'off' } });
    await loopCommand.execute(interactionOff, queueManager);
    assert.equal(queue.loopMode, LoopMode.OFF);
  });

  it('/shuffle shuffles the queue', async () => {
    const songs = Array.from({ length: 15 }, (_, i) => ({
      title: `Song ${i + 1}`,
      url: `https://youtube.com/${i + 1}`,
    }));
    queue.addSongs(songs);

    const interaction = createMockInteraction();
    await shuffleCommand.execute(interaction, queueManager);
    assert.ok(interaction.replyPayload);
  });

  it('/skipto jumps to selected song', async () => {
    queue.addSongs([
      { title: 'Song 1', url: 'https://youtube.com/1' },
      { title: 'Song 2', url: 'https://youtube.com/2' },
      { title: 'Song 3', url: 'https://youtube.com/3' },
    ]);
    // Song 1 is playing, Song 2 is #1, Song 3 is #2 in waiting queue

    const interaction = createMockInteraction({ options: { posicion: 2 } });
    await skiptoCommand.execute(interaction, queueManager);
    assert.equal(queue.currentSong.title, 'Song 3');
    assert.ok(interaction.replyPayload);
  });

  it('/remove deletes a specific song from queue', async () => {
    queue.addSongs([
      { title: 'Song 1', url: 'https://youtube.com/1' },
      { title: 'Song 2', url: 'https://youtube.com/2' },
      { title: 'Song 3', url: 'https://youtube.com/3' },
    ]);
    // Song 1 is playing, Song 2 is #1, Song 3 is #2

    const interaction = createMockInteraction({ options: { posicion: 1 } });
    await removeCommand.execute(interaction, queueManager);
    assert.equal(queue.songs.length, 1);
    assert.equal(queue.songs[0].title, 'Song 3');
    assert.ok(interaction.replyPayload);
  });

  it('/clear empties the waiting queue', async () => {
    queue.addSongs([
      { title: 'Song 1', url: 'https://youtube.com/1' },
      { title: 'Song 2', url: 'https://youtube.com/2' },
    ]);

    const interaction = createMockInteraction();
    await clearCommand.execute(interaction, queueManager);
    assert.equal(queue.songs.length, 0);
    assert.equal(queue.currentSong.title, 'Song 1'); // Current song untouched
    assert.ok(interaction.replyPayload);
  });

  it('/previous plays the previous song from history', async () => {
    queue.addSongs([
      { title: 'Song 1', url: 'https://youtube.com/1' },
      { title: 'Song 2', url: 'https://youtube.com/2' },
    ]);
    // Song 1 is playing. Force playNext to advance to Song 2 so Song 1 is in history
    await queue.playNext();
    assert.equal(queue.currentSong.title, 'Song 2');

    const interaction = createMockInteraction();
    await previousCommand.execute(interaction, queueManager);
    assert.equal(queue.currentSong.title, 'Song 1');
    assert.ok(interaction.replyPayload);
  });

  it('/queue returns embed and pagination components', async () => {
    const songs = Array.from({ length: 25 }, (_, i) => ({
      title: `Track ${i + 1}`,
      url: `https://youtube.com/${i + 1}`,
      durationSec: 180,
    }));
    queue.addSongs(songs);

    const interaction = createMockInteraction({ options: { pagina: 1 } });
    await queueCommand.execute(interaction, queueManager);

    assert.ok(interaction.replyPayload.embeds);
    assert.ok(interaction.replyPayload.components);
    assert.equal(interaction.replyPayload.components.length, 1); // 1 ActionRow with pagination
  });
});
