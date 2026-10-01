import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta a la siguiente canción en la cola'),

  async execute(interaction, queueManager) {
    const queue = queueManager.get(interaction.guildId);

    if (!queue || !queue.currentSong) {
      return interaction.reply({
        embeds: [createErrorEmbed('No hay ninguna canción reproduciéndose actualmente.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== queue.voiceChannel?.id) {
      return interaction.reply({
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para saltar la canción.')],
        flags: MessageFlags.Ephemeral,
      });
    }

    const skippedSongTitle = queue.currentSong.title;
    const skipped = queue.skip();

    if (skipped) {
      return interaction.reply({
        embeds: [createSuccessEmbed(`Saltada: **${skippedSongTitle}** ⏭️`)],
      });
    } else {
      return interaction.reply({
        embeds: [createErrorEmbed('No se pudo saltar la canción.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
