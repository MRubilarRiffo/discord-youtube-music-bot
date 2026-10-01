import { SlashCommandBuilder } from 'discord.js';
import { createSuccessEmbed, createErrorEmbed } from '../utils/embed.js';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen de la música (0 a 100%)')
    .addIntegerOption((option) =>
      option
        .setName('nivel')
        .setDescription('Porcentaje de volumen (0 a 100)')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true)
    ),

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
        embeds: [createErrorEmbed('Debes estar en el mismo canal de voz que el bot para cambiar el volumen.')],
        ephemeral: true,
      });
    }

    const volumeLevel = interaction.options.getInteger('nivel');
    queue.setVolume(volumeLevel);

    return interaction.reply({
      embeds: [createSuccessEmbed(`Volumen ajustado al **${volumeLevel}%** 🔊`)],
    });
  },
};
