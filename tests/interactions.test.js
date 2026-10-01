import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { QueueManager } from '../src/music/QueueManager.js';
import { createMockInteraction } from './helpers/discordMock.js';
import playCommand from '../src/commands/play.js';
import { LoopMode } from '../src/domain/Queue.js';
import { handleButtonInteraction, handleVoiceStateUpdate } from '../src/interactionHandler.js';

describe('Interaction Handlers & E2E Button / Voice Flows', () => {
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
    queue.voiceChannel = {
      id: 'voice-1',
      members: {
        filter: (fn) => ({ size: 0 }),
      },
    };
  });

  it('handles autocomplete interaction properly', async () => {
    const interaction = createMockInteraction({
      options: { _focused: 'bohemian' },
    });
    await playCommand.autocomplete(interaction);
    assert.ok(interaction.choices);
    assert.ok(Array.isArray(interaction.choices));
  });

  it('handles music_loop button: toggles mode and updates message', async () => {
    queue.addSong({ title: 'Song 1', url: 'https://youtube.com/1' });
    const interaction = createMockInteraction({ customId: 'music_loop' });

    await handleButtonInteraction(interaction, queueManager);
    assert.equal(queue.loopMode, LoopMode.SONG);
    assert.ok(interaction.replyPayload);
  });

  it('handles music_shuffle button: shuffles queue and confirms', async () => {
    queue.addSongs([
      { title: 'Song 1', url: 'https://youtube.com/1' },
      { title: 'Song 2', url: 'https://youtube.com/2' },
      { title: 'Song 3', url: 'https://youtube.com/3' },
    ]);
    const interaction = createMockInteraction({ customId: 'music_shuffle' });

    await handleButtonInteraction(interaction, queueManager);
    assert.ok(interaction.replyPayload);
  });

  it('handles music_previous button: goes back to previous song', async () => {
    queue.addSongs([
      { title: 'Song 1', url: 'https://youtube.com/1' },
      { title: 'Song 2', url: 'https://youtube.com/2' },
    ]);
    await queue.playNext(); // Now Song 2 is playing, Song 1 is in history
    assert.equal(queue.currentSong.title, 'Song 2');

    const interaction = createMockInteraction({ customId: 'music_previous' });
    await handleButtonInteraction(interaction, queueManager);

    assert.equal(queue.currentSong.title, 'Song 1');
    assert.ok(interaction.replyPayload);
  });

  it('handles queue pagination buttons (queue_page_next, queue_page_prev)', async () => {
    const songs = Array.from({ length: 35 }, (_, i) => ({
      title: `Track ${i + 1}`,
      url: `https://youtube.com/${i + 1}`,
      durationSec: 180,
    }));
    queue.addSongs(songs);

    const interactionNext = createMockInteraction({ customId: 'queue_page_next' });
    interactionNext.message = {
      embeds: [{ footer: { text: 'Página 1 de 4 • Total en cola: 35' } }],
    };

    await handleButtonInteraction(interactionNext, queueManager);
    assert.ok(interactionNext.updatePayload);
    const updatedEmbed = interactionNext.updatePayload.embeds[0];
    assert.ok(updatedEmbed.data.footer.text.includes('Página 2 de 4'));

    const interactionPrev = createMockInteraction({ customId: 'queue_page_prev' });
    interactionPrev.message = {
      embeds: [{ footer: { text: 'Página 2 de 4 • Total en cola: 35' } }],
    };

    await handleButtonInteraction(interactionPrev, queueManager);
    assert.ok(interactionPrev.updatePayload);
    const prevEmbed = interactionPrev.updatePayload.embeds[0];
    assert.ok(prevEmbed.data.footer.text.includes('Página 1 de 4'));
  });

  it('triggers grace period on empty voice channel instead of abrupt stop', () => {
    assert.equal(queue.graceTimer, null);

    const oldState = { guild: { id: 'guild-1' }, channelId: 'voice-1' };
    const newState = { guild: { id: 'guild-1' }, channelId: null };

    handleVoiceStateUpdate(oldState, newState, queueManager);
    assert.notEqual(queue.graceTimer, null);
  });
});
