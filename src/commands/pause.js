import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la reproducción actual'),

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
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para pausar la música.')],
        ephemeral: true,
      });
    }

    if (queue.isPaused) {
      return interaction.reply({
        embeds: [createErrorEmbed('La música ya está pausada. Usa `/resume` para continuar.')],
        ephemeral: true,
      });
    }

    const paused = queue.pause();
    if (paused) {
      return interaction.reply({
        embeds: [createSuccessEmbed('Reproducción pausada ⏸️')],
      });
    } else {
      return interaction.reply({
        embeds: [createErrorEmbed('No se pudo pausar la música.')],
        ephemeral: true,
      });
    }
  },
};
