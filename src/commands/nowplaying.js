import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createNowPlayingEmbed, createPlayerControls, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la canción que se está reproduciendo actualmente y sus controles'),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || !queue.currentSong) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay ninguna canción reproduciéndose actualmente.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = createNowPlayingEmbed(queue.currentSong, {
      isPaused: queue.isPaused,
      volume: queue.volume,
      currentSec: queue.getCurrentPlaybackSec(),
      loopMode: queue.loopMode,
    });
    const components = createPlayerControls(queue.isPaused, queue.loopMode);

    return interaction.reply({
      embeds: [embed],
      components: components,
    });
  },
};
