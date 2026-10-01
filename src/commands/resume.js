import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la reproducción de música pausada'),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || !queue.currentSong) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay ninguna canción reproduciéndose actualmente.')],
        ephemeral: true,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para reanudar la música.')],
        ephemeral: true,
      });
    }

    if (!queue.isPaused) {
      return interaction.reply({
        embeds: [createErrorEmbed('La música no está pausada.')],
        ephemeral: true,
      });
    }

    const resumed = queue.resume();
    if (resumed) {
      return interaction.reply({
        embeds: [createSuccessEmbed('Reproducción reanudada ▶️')],
      });
    } else {
      return interaction.reply({
        embeds: [createErrorEmbed('No se pudo reanudar la música.')],
        ephemeral: true,
      });
    }
  },
};
