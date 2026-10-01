import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Vuelve a reproducir la canción anterior'),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay ninguna sesión activa en este servidor.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para usar este comando.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const prevSong = queue.previous();
    if (!prevSong) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay canciones previas en el historial de reproducción.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({
      embeds: [createSuccessEmbed(`Volviendo a reproducir: **${prevSong.title}** ⏮️`)],
    });
  },
};
