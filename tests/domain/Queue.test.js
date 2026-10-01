import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Queue, LoopMode } from '../../src/domain/Queue.js';

describe('Domain: Queue Entity', () => {
  const createSong = (title, url = `https://youtube.com/watch?v=${title}`) => ({
    title,
    url,
    durationSec: 180,
    thumbnail: 'https://example.com/thumb.jpg',
    channel: 'Test Channel',
    requestedBy: { id: '123', username: 'TestUser' },
  });

  it('initializes with default empty state and loopMode OFF', () => {
    const queue = new Queue();
    assert.equal(queue.size(), 0);
    assert.equal(queue.currentSong, null);
    assert.equal(queue.loopMode, LoopMode.OFF);
    assert.equal(queue.isEmpty(), true);
  });

  it('adds a single song and handles getNextSong', () => {
    const queue = new Queue();
    const song1 = createSong('Song 1');
    const song2 = createSong('Song 2');

    queue.addSong(song1);
    queue.addSong(song2);

    assert.equal(queue.size(), 2);
    assert.equal(queue.isEmpty(), false);

    const next1 = queue.getNextSong();
    assert.equal(next1.title, 'Song 1');
    assert.equal(queue.currentSong.title, 'Song 1');
    assert.equal(queue.size(), 1);

    const next2 = queue.getNextSong();
    assert.equal(next2.title, 'Song 2');
    assert.equal(queue.currentSong.title, 'Song 2');
    assert.equal(queue.size(), 0);

    const next3 = queue.getNextSong();
    assert.equal(next3, null);
    assert.equal(queue.currentSong, null);
  });

  it('adds multiple songs at once (e.g. playlist)', () => {
    const queue = new Queue();
    const songs = [createSong('Song 1'), createSong('Song 2'), createSong('Song 3')];

    queue.addSongs(songs);
    assert.equal(queue.size(), 3);
    assert.equal(queue.songs[0].title, 'Song 1');
    assert.equal(queue.songs[2].title, 'Song 3');
  });

  it('supports LoopMode.SONG: repeats the same song on getNextSong', () => {
    const queue = new Queue();
    const song1 = createSong('Song 1');
    const song2 = createSong('Song 2');

    queue.addSong(song1);
    queue.addSong(song2);

    queue.getNextSong(); // currentSong is Song 1
    queue.setLoopMode(LoopMode.SONG);

    const repeat1 = queue.getNextSong();
    assert.equal(repeat1.title, 'Song 1');
    assert.equal(queue.currentSong.title, 'Song 1');
    assert.equal(queue.size(), 1); // Song 2 is still waiting
  });

  it('supports LoopMode.QUEUE: moves finished song to end of queue', () => {
    const queue = new Queue();
    const song1 = createSong('Song 1');
    const song2 = createSong('Song 2');

    queue.addSong(song1);
    queue.addSong(song2);

    queue.getNextSong(); // currentSong is Song 1
    queue.setLoopMode(LoopMode.QUEUE);

    const next = queue.getNextSong();
    assert.equal(next.title, 'Song 2');
    assert.equal(queue.currentSong.title, 'Song 2');
    assert.equal(queue.size(), 1);
    assert.equal(queue.songs[0].title, 'Song 1'); // Song 1 re-added to end
  });

  it('supports shuffle: randomizes waiting songs without altering currentSong', () => {
    const queue = new Queue();
    const song0 = createSong('Song 0');
    queue.addSong(song0);
    queue.getNextSong(); // Song 0 is currentSong

    const songs = Array.from({ length: 30 }, (_, i) => createSong(`Song ${i + 1}`));
    queue.addSongs(songs);

    const originalTitles = queue.songs.map((s) => s.title);
    queue.shuffle();

    assert.equal(queue.currentSong.title, 'Song 0');
    assert.equal(queue.size(), 30);
    // Almost impossible (1/30!) for Fisher-Yates to produce the exact original order with 30 items
    const shuffledTitles = queue.songs.map((s) => s.title);
    assert.notDeepEqual(shuffledTitles, originalTitles);
    // But all elements must still be present
    assert.equal(new Set(shuffledTitles).size, 30);
  });

  it('supports remove: removes a song by 1-based index', () => {
    const queue = new Queue();
    queue.addSongs([createSong('Song 1'), createSong('Song 2'), createSong('Song 3')]);

    const removed = queue.remove(2); // Remove Song 2
    assert.equal(removed.title, 'Song 2');
    assert.equal(queue.size(), 2);
    assert.equal(queue.songs[0].title, 'Song 1');
    assert.equal(queue.songs[1].title, 'Song 3');

    // Out of bounds
    assert.throws(() => queue.remove(0), /Índice fuera de rango/);
    assert.throws(() => queue.remove(5), /Índice fuera de rango/);
  });

  it('supports skipTo: jumps to a 1-based index, discarding preceding songs', () => {
    const queue = new Queue();
    queue.addSongs([
      createSong('Song 1'),
      createSong('Song 2'),
      createSong('Song 3'),
      createSong('Song 4'),
    ]);

    const target = queue.skipTo(3); // Skip to Song 3
    assert.equal(target.title, 'Song 3');
    assert.equal(queue.currentSong.title, 'Song 3');
    assert.equal(queue.size(), 1);
    assert.equal(queue.songs[0].title, 'Song 4');

    // Out of bounds
    assert.throws(() => queue.skipTo(0), /Índice fuera de rango/);
    assert.throws(() => queue.skipTo(10), /Índice fuera de rango/);
  });

  it('supports clear: empties waiting queue but preserves currentSong and history', () => {
    const queue = new Queue();
    queue.addSongs([createSong('Song 1'), createSong('Song 2'), createSong('Song 3')]);
    queue.getNextSong(); // current is Song 1

    queue.clear();
    assert.equal(queue.size(), 0);
    assert.equal(queue.currentSong.title, 'Song 1');
  });

  it('supports previous: restores the previously played song from history', () => {
    const queue = new Queue();
    const song1 = createSong('Song 1');
    const song2 = createSong('Song 2');
    const song3 = createSong('Song 3');

    queue.addSongs([song1, song2, song3]);
    queue.getNextSong(); // Playing Song 1
    queue.getNextSong(); // Playing Song 2, Song 1 in history

    assert.equal(queue.currentSong.title, 'Song 2');
    assert.equal(queue.history.length, 1);
    assert.equal(queue.history[0].title, 'Song 1');

    const prev = queue.getPreviousSong();
    assert.equal(prev.title, 'Song 1');
    assert.equal(queue.currentSong.title, 'Song 1');
    assert.equal(queue.songs[0].title, 'Song 2'); // Song 2 put back to head of queue

    // Calling previous when history is empty returns null
    assert.equal(queue.getPreviousSong(), null);
  });
});
