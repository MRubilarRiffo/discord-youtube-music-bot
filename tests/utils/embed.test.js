import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDuration,
  createProgressBar,
  createNowPlayingEmbed,
  createPlayerControls,
  createQueueEmbed,
  createQueuePaginationButtons,
} from '../../src/utils/embed.js';

describe('Embed and UI Controls', () => {
  it('formats durations properly', () => {
    assert.equal(formatDuration(0), '00:00');
    assert.equal(formatDuration(75), '01:15');
    assert.equal(formatDuration(3665), '01:01:05');
    assert.equal(formatDuration(-10), '00:00');
  });

  it('generates progress bar', () => {
    const barEmpty = createProgressBar(0, 100, 10);
    assert.ok(barEmpty.startsWith('🔘'));

    const barHalf = createProgressBar(50, 100, 10);
    assert.ok(barHalf.includes('🔘'));
  });

  it('creates now playing embed with loop mode information', () => {
    const song = {
      title: 'Test Song',
      url: 'https://youtube.com/watch?v=123',
      durationSec: 180,
      channel: 'Artist',
      requestedBy: { id: '456' },
    };

    const embed = createNowPlayingEmbed(song, {
      isPaused: false,
      volume: 0.8,
      currentSec: 60,
      loopMode: 'song',
    });

    assert.equal(embed.data.title, 'Test Song');
    const loopField = embed.data.fields.find((f) => f.name === 'Bucle');
    assert.ok(loopField);
    assert.equal(loopField.value, '🔂 Canción');
  });

  it('generates player controls with 2 action rows including shuffle and loop', () => {
    const controls = createPlayerControls(false, 'queue');
    assert.equal(controls.length, 2);
    // Row 1 has 4 buttons: pause, skip, stop, queue
    assert.equal(controls[0].components.length, 4);
    // Row 2 has 3 buttons: previous, shuffle, loop
    assert.equal(controls[1].components.length, 3);
  });

  it('generates queue pagination buttons with proper disabled states', () => {
    // Page 1 of 5
    const rowPage1 = createQueuePaginationButtons(1, 5);
    const buttonsP1 = rowPage1.components;
    assert.equal(buttonsP1.length, 5);
    assert.equal(buttonsP1[0].data.disabled, true); // First
    assert.equal(buttonsP1[1].data.disabled, true); // Prev
    assert.equal(buttonsP1[3].data.disabled, false); // Next
    assert.equal(buttonsP1[4].data.disabled, false); // Last

    // Page 3 of 5
    const rowPage3 = createQueuePaginationButtons(3, 5);
    const buttonsP3 = rowPage3.components;
    assert.equal(buttonsP3[0].data.disabled, false); // First
    assert.equal(buttonsP3[1].data.disabled, false); // Prev
    assert.equal(buttonsP3[3].data.disabled, false); // Next
    assert.equal(buttonsP3[4].data.disabled, false); // Last

    // Page 5 of 5
    const rowPage5 = createQueuePaginationButtons(5, 5);
    const buttonsP5 = rowPage5.components;
    assert.equal(buttonsP5[0].data.disabled, false); // First
    assert.equal(buttonsP5[1].data.disabled, false); // Prev
    assert.equal(buttonsP5[3].data.disabled, true); // Next
    assert.equal(buttonsP5[4].data.disabled, true); // Last
  });
});
