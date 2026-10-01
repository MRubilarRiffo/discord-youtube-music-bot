import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skipto')
    .setDescription('Salta directamente a una canción en la cola por su posición')
    .addIntegerOption((option) =>
      option
        .setName('posicion')
        .setDescription('Número de posición de la canción en la cola')
        .setMinValue(1)
        .setRequired(true)
    ),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay canciones en espera en la cola.')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para saltar canciones.')],
        ephemeral: true,
      });
    }

    const index = interaction.options.getInteger('posicion');

    if (index > queue.songs.length) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            `Posición inválida. La cola solo tiene **${queue.songs.length}** canciones en espera.`
          ),
        ],
        ephemeral: true,
      });
    }

    const targetSong = queue.skipTo(index);

    return interaction.reply({
      embeds: [createSuccessEmbed(`Saltado directamente a la posición #${index}: **${targetSong.title}** ⏭️`)],
    });
  },
};
