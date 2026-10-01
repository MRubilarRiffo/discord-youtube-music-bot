import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Elimina una canción específica de la cola por su posición')
    .addIntegerOption((option) =>
      option
        .setName('posicion')
        .setDescription('Número de posición de la canción a eliminar')
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay canciones en la cola para eliminar.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para eliminar canciones.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const index = interaction.options.getInteger('posicion');

    if (index > queue.songs.length) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            `Posición inválida. La cola solo contiene **${queue.songs.length}** canciones.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const removedSong = queue.remove(index);

    return interaction.reply({
      embeds: [createSuccessEmbed(`Eliminada de la cola: **${removedSong.title}** 🗑️`)],
    });
  },
};
