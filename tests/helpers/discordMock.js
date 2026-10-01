export function createMockInteraction({
  guildId = 'guild-1',
  user = { id: 'user-1', username: 'TestUser' },
  voiceChannelId = 'voice-1',
  botVoiceChannelId = 'voice-1',
  options = {},
  customId = null,
} = {}) {
  const memberVoiceChannel = voiceChannelId
    ? {
        id: voiceChannelId,
        permissionsFor: () => ({
          has: () => true,
        }),
      }
    : null;

  const interaction = {
    guildId,
    user,
    member: {
      user,
      voice: {
        channel: memberVoiceChannel,
      },
    },
    client: {
      user: { id: 'bot-id' },
    },
    channel: {
      id: 'text-1',
      send: async () => ({ edit: async () => {} }),
    },
    customId,
    replied: false,
    deferred: false,
    replyPayload: null,
    editReplyPayload: null,
    updatePayload: null,
    options: {
      getString: (name) => options[name] || null,
      getInteger: (name) => options[name] !== undefined ? options[name] : null,
      getFocused: () => options._focused || '',
    },
    reply: async (payload) => {
      interaction.replied = true;
      interaction.replyPayload = payload;
      return payload;
    },
    deferReply: async (opts) => {
      interaction.deferred = true;
    },
    editReply: async (payload) => {
      interaction.editReplyPayload = payload;
      return payload;
    },
    update: async (payload) => {
      interaction.updatePayload = payload;
      return payload;
    },
    respond: async (choices) => {
      interaction.choices = choices;
      return choices;
    },
  };

  return interaction;
}
