import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSongInfo,
  getYouTubeSuggestions,
} from '../../src/utils/youtube.js';

describe('YouTube Utils & Autocomplete', () => {
  it('formats raw video entry correctly', () => {
    const raw = {
      title: 'Bohemian Rhapsody',
      url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
      duration: 355,
      uploader: 'Queen Official',
      thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    };
    const user = { id: 'u1', username: 'Freddie' };

    const formatted = formatSongInfo(raw, user);
    assert.equal(formatted.title, 'Bohemian Rhapsody');
    assert.equal(formatted.url, 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ');
    assert.equal(formatted.durationSec, 355);
    assert.equal(formatted.channel, 'Queen Official');
    assert.equal(formatted.requestedBy.username, 'Freddie');
  });

  it('provides autocomplete suggestions formatted for Discord interaction choices', async () => {
    // If query is empty or too short, return empty array
    const emptyResult = await getYouTubeSuggestions('');
    assert.deepEqual(emptyResult, []);

    const shortResult = await getYouTubeSuggestions('a');
    assert.deepEqual(shortResult, []);

    // Query for suggestions
    const suggestions = await getYouTubeSuggestions('Queen Bohemian Rhapsody', 3);
    assert.ok(Array.isArray(suggestions));
    assert.ok(suggestions.length > 0 && suggestions.length <= 3);

    for (const choice of suggestions) {
      assert.ok(choice.name);
      assert.ok(choice.value);
      assert.ok(choice.name.length <= 100, 'Choice name must be <= 100 characters for Discord API');
      assert.ok(choice.value.length <= 100, 'Choice value must be <= 100 characters for Discord API');
    }
  });
});
