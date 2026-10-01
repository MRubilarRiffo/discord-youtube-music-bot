import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GuildQueue } from '../../src/music/GuildQueue.js';
import { LoopMode } from '../../src/domain/Queue.js';

describe('GuildQueue Player & Orchestration', () => {
  let guildQueue;
  let mockManager;

  const createSong = (title, url = `https://youtube.com/watch?v=${title}`) => ({
    title,
    url,
    durationSec: 200,
    thumbnail: 'https://example.com/thumb.jpg',
    channel: 'Artist Channel',
    requestedBy: { id: 'u1', username: 'Listener' },
  });

  beforeEach(() => {
    mockManager = {
      delete: () => true,
    };
    guildQueue = new GuildQueue('guild-123', mockManager, {
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
  });

  it('initializes with LoopMode.OFF and empty queue', () => {
    assert.equal(guildQueue.loopMode, LoopMode.OFF);
    assert.equal(guildQueue.songs.length, 0);
    assert.equal(guildQueue.currentSong, null);
  });

  it('manages song addition and delegates to Queue domain', () => {
    const s1 = createSong('Song A');
    const s2 = createSong('Song B');

    // With idle player, addSong plays s1 and s2 stays in queue
    guildQueue.addSong(s1);
    guildQueue.addSong(s2);

    assert.equal(guildQueue.currentSong.title, 'Song A');
    assert.equal(guildQueue.songs.length, 1);
    assert.equal(guildQueue.songs[0].title, 'Song B');
  });

  it('supports loop mode toggling and changes', () => {
    assert.equal(guildQueue.setLoopMode(LoopMode.SONG), LoopMode.SONG);
    assert.equal(guildQueue.loopMode, LoopMode.SONG);

    assert.equal(guildQueue.setLoopMode(LoopMode.QUEUE), LoopMode.QUEUE);
    assert.equal(guildQueue.loopMode, LoopMode.QUEUE);

    assert.equal(guildQueue.setLoopMode(LoopMode.OFF), LoopMode.OFF);
    assert.equal(guildQueue.loopMode, LoopMode.OFF);

    // Toggle loop
    assert.equal(guildQueue.toggleLoop(), LoopMode.SONG);
    assert.equal(guildQueue.toggleLoop(), LoopMode.QUEUE);
    assert.equal(guildQueue.toggleLoop(), LoopMode.OFF);
  });

  it('supports shuffle', () => {
    const songs = Array.from({ length: 20 }, (_, i) => createSong(`Track ${i + 1}`));
    guildQueue.addSongs(songs);

    const shuffled = guildQueue.shuffle();
    assert.ok(Array.isArray(shuffled));
  });

  it('supports remove from waiting queue', () => {
    guildQueue.addSongs([createSong('Track 1'), createSong('Track 2'), createSong('Track 3')]);
    // Track 1 is currently playing, Track 2 is #1 in queue, Track 3 is #2 in queue
    assert.equal(guildQueue.currentSong.title, 'Track 1');
    assert.equal(guildQueue.songs.length, 2);

    const removed = guildQueue.remove(1);
    assert.equal(removed.title, 'Track 2');
    assert.equal(guildQueue.songs.length, 1);
    assert.equal(guildQueue.songs[0].title, 'Track 3');
  });

  it('supports clear', () => {
    guildQueue.addSongs([createSong('Track 1'), createSong('Track 2')]);
    guildQueue.clear();
    assert.equal(guildQueue.songs.length, 0);
  });

  it('manages empty channel grace period: starts timer and cancels when member joins', () => {
    assert.equal(guildQueue.graceTimer, null);

    // Member count becomes 0 -> starts grace timer
    guildQueue.handleVoiceStateChange(0);
    assert.notEqual(guildQueue.graceTimer, null);

    // Member joins -> count becomes 1 -> cancels grace timer
    guildQueue.handleVoiceStateChange(1);
    assert.equal(guildQueue.graceTimer, null);
  });
});
