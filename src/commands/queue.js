import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createQueueEmbed, createQueuePaginationButtons, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la lista de canciones en la cola de reproducción')
    .addIntegerOption((option) =>
      option
        .setName('pagina')
        .setDescription('Número de página a visualizar')
        .setMinValue(1)
        .setRequired(false)
    ),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
      return interaction.reply({
        embeds: [createErrorEmbed('La cola de reproducción está vacía actualmente.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(queue.songs.length / itemsPerPage));
    const requestedPage = interaction.options.getInteger('pagina') || 1;
    const page = Math.min(Math.max(1, requestedPage), totalPages);

    const embed = createQueueEmbed(queue.currentSong, queue.songs, page, itemsPerPage, queue.loopMode);
    const components = totalPages > 1 ? [createQueuePaginationButtons(page, totalPages)] : [];

    return interaction.reply({
      embeds: [embed],
      components,
    });
  },
};
